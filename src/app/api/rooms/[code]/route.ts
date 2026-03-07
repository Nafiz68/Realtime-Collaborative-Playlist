import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  props: { params: Promise<{ code: string }> }
) {
  const { code } = await props.params;

  const room = await prisma.room.findUnique({ where: { code } });

  if (!room) {
    return NextResponse.json(
      { error: { code: "ROOM_NOT_FOUND", message: "Room not found. Check your code and try again." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ id: room.id, code: room.code, created_at: room.created_at });
}
