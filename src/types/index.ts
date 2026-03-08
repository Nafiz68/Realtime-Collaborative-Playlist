// Types for the application
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration_seconds: number;
  genre: string;
  cover_url: string | null;
  preview_url: string | null;
}

export interface PlaylistTrack {
  id: string;
  position: number;
  votes: number;
  added_by: string;
  added_at: Date | string;
  is_playing: boolean;
  played_at: Date | string | null;
  track: Track;
}

export type SSEEvent = 
  | { type: 'connected'; clientId: string }
  | { type: 'track.added'; item: PlaylistTrack }
  | { type: 'track.removed'; id: string }
  | { type: 'track.moved'; item: { id: string; position: number } }
  | { type: 'track.voted'; item: { id: string; votes: number } }
  | { type: 'track.playing'; id: string }
  | { type: 'playlist.reordered'; items: PlaylistTrack[] }
  | { type: 'ping'; ts: string };
