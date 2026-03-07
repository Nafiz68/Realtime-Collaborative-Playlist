import { sseManager } from "@/lib/sse-manager";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const roomCode = url.searchParams.get('code') || '';

  if (!roomCode) {
    return new Response('Missing room code', { status: 400 });
  }

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  const stream = new ReadableStream({
    start(controller) {
      // Add client to SSE manager scoped to the room
      sseManager.addClient(clientId, controller, roomCode);

      // Send initial connection message
      const initMessage = `data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initMessage));
    },
    cancel() {
      // Remove client when connection closes
      sseManager.removeClient(clientId, roomCode);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
