import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sseManager } from "@/lib/sse-manager";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';

  if (!code) {
    return NextResponse.json({ error: { code: 'MISSING_ROOM', message: 'Room code is required' } }, { status: 400 });
  }

  const room = await prisma.room.findUnique({ where: { code } });
  if (!room) {
    return NextResponse.json({ error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' } }, { status: 404 });
  }

  const playlist = await prisma.playlistTrack.findMany({
    where: { room_id: room.id },
    orderBy: { position: "asc" },
    include: {
      track: {
        select: {
          id: true,
          title: true,
          artist: true,
          album: true,
          duration_seconds: true,
          genre: true,
          cover_url: true,
        },
      },
    },
  });

  const result = playlist.map(item => ({
    id: item.id,
    position: item.position,
    votes: item.votes,
    added_by: item.added_by,
    added_at: item.added_at,
    is_playing: item.is_playing,
    played_at: item.played_at,
    track: item.track,
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code') || '';
    const body = await request.json();
    const { track_id, added_by } = body || {};

    // Validation
    if (!code) {
      return NextResponse.json({ error: { code: 'MISSING_ROOM', message: 'Room code is required' } }, { status: 400 });
    }
    if (!track_id || !added_by) {
      return NextResponse.json({
        error: { code: "VALIDATION_ERROR", message: "track_id and added_by are required" }
      }, { status: 400 });
    }

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return NextResponse.json({ error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' } }, { status: 404 });
    }

    // Duplicate check (per room)
    const existing = await prisma.playlistTrack.findUnique({
      where: { track_id_room_id: { track_id, room_id: room.id } }
    });
    if (existing) {
      return NextResponse.json({
        error: {
          code: "DUPLICATE_TRACK",
          message: "This track is already in the playlist",
          details: { track_id }
        }
      }, { status: 400 });
    }

    // Find max position in this room
    const maxPosition = await prisma.playlistTrack.aggregate({
      where: { room_id: room.id },
      _max: { position: true }
    });
    const position = maxPosition._max.position != null ? maxPosition._max.position + 1 : 1.0;

    // Create PlaylistTrack scoped to this room
    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        id: `playlist-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        track_id,
        room_id: room.id,
        position,
        votes: 0,
        added_by,
        added_at: new Date(),
        is_playing: false,
        played_at: null,
      },
      include: { track: true }
    });

    // Broadcast only to clients in this room
    sseManager.broadcast({ type: 'track.added', item: playlistTrack }, code);

    return NextResponse.json(playlistTrack, { status: 201 });
  } catch (e) {
    console.error('Error adding track:', e);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "An error occurred" } }, { status: 500 });
  }
}
