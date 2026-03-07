import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sseManager } from "@/lib/sse-manager";

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const body = await request.json();
  const { position, is_playing } = body || {};

  // Look up the playlist track to get its room code for SSE broadcasting
  const existing = await prisma.playlistTrack.findUnique({
    where: { id },
    include: { room: true }
  });
  if (!existing) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Track not found' } }, { status: 404 });
  }
  const roomCode = existing.room.code;

  let updated;
  if (typeof is_playing === "boolean") {
    if (is_playing) {
      // Enforce only one is_playing=true within this room
      const result = await prisma.$transaction([
        prisma.playlistTrack.updateMany({
          where: { is_playing: true, room_id: existing.room_id },
          data: { is_playing: false },
        }),
        prisma.playlistTrack.update({
          where: { id },
          data: {
            is_playing: true,
            played_at: new Date(),
            ...(typeof position === "number" ? { position } : {}),
          },
          include: { track: true },
        }),
      ]);
      updated = result[1];
    } else {
      updated = await prisma.playlistTrack.update({
        where: { id },
        data: {
          is_playing: false,
          ...(typeof position === "number" ? { position } : {}),
        },
        include: { track: true },
      });
    }
  } else if (typeof position === "number") {
    updated = await prisma.playlistTrack.update({
      where: { id },
      data: { position },
      include: { track: true },
    });
  } else {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "No valid fields to update" } }, { status: 400 });
  }

  // Broadcast scoped to the room
  if (typeof is_playing === "boolean" && is_playing) {
    sseManager.broadcast({ type: 'track.playing', id }, roomCode);
  } else if (typeof position === "number") {
    sseManager.broadcast({ type: 'track.moved', item: { id, position } }, roomCode);
  }

  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  // Look up the track's room before deleting
  const existing = await prisma.playlistTrack.findUnique({
    where: { id },
    include: { room: true }
  });
  if (!existing) {
    return new NextResponse(null, { status: 204 });
  }
  const roomCode = existing.room.code;

  await prisma.playlistTrack.delete({ where: { id } });

  // Broadcast scoped to the room
  sseManager.broadcast({ type: 'track.removed', id }, roomCode);

  return new NextResponse(null, { status: 204 });
}
