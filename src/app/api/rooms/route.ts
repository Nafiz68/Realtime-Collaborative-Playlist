import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateRoomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST() {
  try {
    // Generate a unique 6-digit code
    let code = generateRoomCode();
    let attempts = 0;

    while (attempts < 10) {
      const existing = await prisma.room.findUnique({ where: { code } });
      if (!existing) break;
      code = generateRoomCode();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: { code: "SERVER_ERROR", message: "Failed to generate unique code" } },
        { status: 500 }
      );
    }

    const room = await prisma.room.create({
      data: {
        code,
      },
    });

    return NextResponse.json({ code: room.code, id: room.id }, { status: 201 });
  } catch (e) {
    console.error("Error creating room:", e);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create room" } },
      { status: 500 }
    );
  }
}
