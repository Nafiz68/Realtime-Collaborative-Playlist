// SSE Event Manager - Singleton for broadcasting events per room
import type { PlaylistTrack } from '@/types';

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

type PlaylistEvent = 
  | { type: 'track.added'; item: PlaylistTrack }
  | { type: 'track.removed'; id: string }
  | { type: 'track.moved'; item: { id: string; position: number } }
  | { type: 'track.voted'; item: { id: string; votes: number } }
  | { type: 'track.playing'; id: string }
  | { type: 'playlist.reordered'; items: PlaylistTrack[] }
  | { type: 'ping'; ts: string };

class SSEManager {
  // Map<roomCode, Map<clientId, SSEClient>>
  private rooms: Map<string, Map<string, SSEClient>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  addClient(id: string, controller: ReadableStreamDefaultController, roomCode: string) {
    if (!this.rooms.has(roomCode)) {
      this.rooms.set(roomCode, new Map());
    }
    this.rooms.get(roomCode)!.set(id, { id, controller });
    const count = this.rooms.get(roomCode)!.size;
    console.log(`[Room ${roomCode}] SSE client connected: ${id}. Clients in room: ${count}`);
  }

  removeClient(id: string, roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.delete(id);
      console.log(`[Room ${roomCode}] SSE client disconnected: ${id}. Clients in room: ${room.size}`);
      if (room.size === 0) {
        this.rooms.delete(roomCode);
      }
    }
  }

  broadcast(event: PlaylistEvent, roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const data = JSON.stringify(event);
    const message = `data: ${data}\n\n`;

    for (const [id, client] of room.entries()) {
      try {
        client.controller.enqueue(new TextEncoder().encode(message));
      } catch (error) {
        console.error(`Error sending to client ${id} in room ${roomCode}:`, error);
        this.removeClient(id, roomCode);
      }
    }
  }

  private startHeartbeat() {
    // Send ping every 30 seconds to keep connections alive across all rooms
    this.heartbeatInterval = setInterval(() => {
      const pingEvent = JSON.stringify({ type: 'ping', ts: new Date().toISOString() });
      const message = `data: ${pingEvent}\n\n`;

      for (const [roomCode, clients] of this.rooms.entries()) {
        for (const [id, client] of clients.entries()) {
          try {
            client.controller.enqueue(new TextEncoder().encode(message));
          } catch {
            this.removeClient(id, roomCode);
          }
        }
      }
    }, 30000);
  }

  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.rooms.clear();
  }
}

// Singleton instance
export const sseManager = new SSEManager();
