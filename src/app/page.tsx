'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Track, PlaylistTrack, SSEEvent } from '@/types';
import { TrackLibrary } from '@/components/TrackLibrary';
import { PlaylistPanel } from '@/components/PlaylistPanel';
import { NowPlayingBar } from '@/components/NowPlayingBar';
import { RoomGate } from '@/components/RoomGate';
import { ShareModal } from '@/components/ShareModal';
import { useSSE } from '@/hooks/useSSE';
import { ArrowUpDown, Download, Clock } from 'lucide-react';

// Inner component that reads search params
function PlaylistApp({ roomCode }: { roomCode: string }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistTrack[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [autoSort, setAutoSort] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [history, setHistory] = useState<PlaylistTrack[]>([]);

  // Fetch initial data scoped to the room
  useEffect(() => {
    Promise.all([
      fetch('/api/tracks').then(res => res.json()),
      fetch(`/api/playlist?code=${roomCode}`).then(res => res.json())
    ]).then(([tracksData, playlistData]) => {
      setTracks(Array.isArray(tracksData) ? tracksData : []);
      setPlaylist(Array.isArray(playlistData) ? playlistData : []);
    });
  }, [roomCode]);

  // Auto-sort by votes
  useEffect(() => {
    if (!autoSort) return;
    const sortedPlaylist = [...playlist].sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      return a.position - b.position;
    });
    const needsUpdate = sortedPlaylist.some((item, idx) => item.id !== playlist[idx]?.id);
    if (needsUpdate) {
      sortedPlaylist.forEach((item, idx) => {
        const newPosition = idx + 1;
        if (item.position !== newPosition) handleReorder(item.id, newPosition);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist, autoSort]);

  // Define handleSkip before keyboard shortcuts
  const handleSkip = useCallback(async () => {
    const currentIndex = playlist.findIndex(item => item.is_playing);
    if (currentIndex === -1) return;
    const currentTrack = playlist[currentIndex];
    const nextTrack = playlist[currentIndex + 1];
    if (nextTrack) {
      await fetch(`/api/playlist/${nextTrack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_playing: true })
      });
    } else {
      await fetch(`/api/playlist/${currentTrack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_playing: false })
      });
    }
  }, [playlist]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          const playButton = document.querySelector('[data-play-toggle]') as HTMLButtonElement;
          playButton?.click();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkip();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          const currentIndex = playlist.findIndex(item => item.is_playing);
          if (currentIndex > 0) {
            const prevTrack = playlist[currentIndex - 1];
            fetch(`/api/playlist/${prevTrack.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_playing: true })
            });
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playlist, handleSkip]);

  // Handle SSE events
  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'ping') return;
    switch (event.type) {
      case 'track.added':
        setPlaylist(prev => {
          if (prev.some(item => item.id === event.item.id)) return prev;
          return [...prev, event.item].sort((a, b) => a.position - b.position);
        });
        break;
      case 'track.removed':
        setPlaylist(prev => prev.filter(item => item.id !== event.id));
        break;
      case 'track.moved':
        setPlaylist(prev =>
          prev.map(item =>
            item.id === event.item.id ? { ...item, position: event.item.position } : item
          ).sort((a, b) => a.position - b.position)
        );
        break;
      case 'track.voted':
        setPlaylist(prev =>
          prev.map(item =>
            item.id === event.item.id ? { ...item, votes: event.item.votes } : item
          )
        );
        break;
      case 'track.playing':
        setPlaylist(prev => {
          const updated = prev.map(item => ({ ...item, is_playing: item.id === event.id }));
          const stoppedPlaying = prev.find(item => item.is_playing && item.id !== event.id);
          if (stoppedPlaying) {
            setHistory(h => [stoppedPlaying, ...h].slice(0, 10));
          }
          return updated;
        });
        break;
    }
  }, []);

  const { connectionStatus: sseStatus } = useSSE({
    onEvent: handleSSEEvent,
    roomCode,
    onConnectionChange: (connected) => {
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    }
  });

  // API Actions — all include ?code= param on playlist routes
  const handleAddTrack = async (trackId: string) => {
    const response = await fetch(`/api/playlist?code=${roomCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: trackId, added_by: 'Anonymous' })
    });
    if (!response.ok) {
      const error = await response.json();
      alert(error.error.message);
      throw new Error(error.error.message);
    }
  };

  const handleVote = async (id: string, direction: 'up' | 'down') => {
    await fetch(`/api/playlist/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction })
    });
  };

  const handleRemove = async (id: string) => {
    await fetch(`/api/playlist/${id}`, { method: 'DELETE' });
  };

  const handleReorder = async (id: string, newPosition: number) => {
    setPlaylist(prev =>
      prev.map(item => item.id === id ? { ...item, position: newPosition } : item)
        .sort((a, b) => a.position - b.position)
    );
    try {
      await fetch(`/api/playlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newPosition })
      });
    } catch {
      const playlistData = await fetch(`/api/playlist?code=${roomCode}`).then(res => res.json());
      setPlaylist(playlistData);
    }
  };

  const handlePlay = async (id: string) => {
    await fetch(`/api/playlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_playing: true })
    });
  };

  const playlistTrackIds = new Set(playlist.map(item => item.track.id));

  const handleExport = () => {
    const exportData = {
      name: `Room ${roomCode} Playlist`,
      code: roomCode,
      created: new Date().toISOString(),
      tracks: playlist.map(item => ({
        title: item.track.title,
        artist: item.track.artist,
        album: item.track.album,
        votes: item.votes,
        position: item.position
      }))
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playlist-${roomCode}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated Background Blobs */}
      <div className="bg-blobs">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
      </div>

      {/* Header */}
      <header className="relative z-10 glass-card border-b border-purple-500/20 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_4px_30px_rgba(168,85,247,0.1)]">
        <div className="flex-1 min-w-0">
          <h1
            className="text-xl sm:text-2xl font-bold truncate"
            style={{
              fontFamily: 'Syne, var(--font-syne), sans-serif',
              background: 'linear-gradient(90deg, #a855f7, #06b6d4, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ◈ Collab Playlist
          </h1>
          <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-muted)' }}>
            Add · Vote · Reorder in realtime &nbsp;·&nbsp; Space: play/pause &nbsp;·&nbsp; ←/→: prev/next
          </p>
        </div>

        {/* Controls & Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Share Button */}
          <button
            onClick={() => setShowShare(true)}
            className="btn-neon flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium"
            title={`Share room code: ${roomCode}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="hidden sm:inline">Share</span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-md"
              style={{
                background: 'rgba(168,85,247,0.3)',
                color: '#d8b4fe',
                fontFamily: 'Syne, var(--font-syne), monospace',
                letterSpacing: '0.08em',
              }}
            >
              {roomCode}
            </span>
          </button>

          {/* Auto-sort toggle */}
          <button
            onClick={() => setAutoSort(!autoSort)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${autoSort ? 'btn-neon-active' : 'btn-neon'}`}
            title="Auto-sort by votes"
          >
            <ArrowUpDown size={14} />
            <span className="hidden sm:inline">Auto-sort</span>
          </button>

          {/* History toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${showHistory ? 'btn-neon-active' : 'btn-neon'}`}
            title="Show history"
          >
            <Clock size={14} />
            <span className="hidden sm:inline">History ({history.length})</span>
          </button>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="btn-neon flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium"
            title="Export playlist"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: sseStatus === 'connected' ? '#10b981' : sseStatus === 'connecting' ? '#facc15' : '#f43f5e',
                animation: sseStatus === 'connected' ? 'connectedPulse 2s ease-in-out infinite' : sseStatus === 'connecting' ? 'connectingPulse 1s ease-in-out infinite' : 'none',
                boxShadow: sseStatus === 'connected' ? '0 0 8px #10b981' : sseStatus === 'connecting' ? '0 0 8px #facc15' : '0 0 8px #f43f5e',
              }}
            />
            <span className="text-xs font-medium capitalize hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
              {sseStatus === 'connected' ? 'Connected' : sseStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* Track Library */}
        <div className="hidden sm:flex sm:w-[320px] flex-col border-r border-purple-500/15 overflow-hidden" style={{ background: 'rgba(13,13,26,0.7)', backdropFilter: 'blur(20px)' }}>
          <TrackLibrary
            tracks={tracks}
            playlistTrackIds={playlistTrackIds}
            onAddTrack={handleAddTrack}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Playlist Panel */}
        <div
          className={`flex-1 overflow-hidden ${showHistory ? 'border-r border-purple-500/15' : ''}`}
          style={{ background: 'rgba(7,7,17,0.5)', backdropFilter: 'blur(20px)' }}
        >
          <PlaylistPanel
            playlist={playlist}
            onVote={handleVote}
            onRemove={handleRemove}
            onReorder={handleReorder}
            onPlay={handlePlay}
            autoSort={autoSort}
          />
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="hidden lg:flex flex-col w-72 border-l border-purple-500/15 overflow-hidden" style={{ background: 'rgba(13,13,26,0.7)', backdropFilter: 'blur(20px)' }}>
            <div className="p-4 border-b border-purple-500/15 flex-shrink-0" style={{ background: 'rgba(168,85,247,0.05)' }}>
              <h2 className="text-base font-bold" style={{ background: 'linear-gradient(90deg, #a855f7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Recently Played
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Last {history.length} tracks</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-24">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
                  <div className="text-3xl">🎵</div>
                  <p className="text-xs text-center">No history yet.<br />Play a track to get started.</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="glass-card rounded-xl p-3 transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-3">
                      {item.track.cover_url ? (
                        <img
                          src={item.track.cover_url}
                          alt={`${item.track.album} cover`}
                          className="w-10 h-10 rounded-lg flex-shrink-0 object-cover"
                          style={{ border: '1px solid rgba(168,85,247,0.3)' }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold"
                          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3))', border: '1px solid rgba(168,85,247,0.3)' }}
                        >
                          {item.track.title.slice(0, 1)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                          {item.track.title}
                        </h4>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {item.track.artist}
                        </p>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: item.votes > 0 ? '#10b981' : item.votes < 0 ? '#f43f5e' : 'var(--text-muted)' }}
                        >
                          {item.votes > 0 && '+'}{item.votes} votes
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Now Playing Bar */}
      <div className="relative z-10">
        <NowPlayingBar playlist={playlist} onSkip={handleSkip} />
      </div>

      {/* Share Modal */}
      {showShare && (
        <ShareModal code={roomCode} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}

// Suspense wrapper to safely read searchParams
function HomeInner() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('code') || '';

  if (!roomCode) {
    return <RoomGate />;
  }

  return <PlaylistApp roomCode={roomCode} />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070711' }}>
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomeInner />
    </Suspense>
  );
}
