import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sseManager } from "@/lib/sse-manager";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const body = await request.json();
  const { direction } = body || {};

  if (direction !== "up" && direction !== "down") {
    return NextResponse.json({
      error: { code: "VALIDATION_ERROR", message: 'direction must be "up" or "down"' }
    }, { status: 400 });
  }

  const updated = await prisma.playlistTrack.update({
    where: { id },
    data: {
      votes: direction === "up" ? { increment: 1 } : { decrement: 1 }
    },
    include: { track: true, room: true }
  });

  // Broadcast scoped to the room
  sseManager.broadcast({ type: 'track.voted', item: { id, votes: updated.votes } }, updated.room.code);

  return NextResponse.json(updated, { status: 200 });
}
