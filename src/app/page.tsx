'use client';

import { useEffect, useState, useCallback } from 'react';
import { Track, PlaylistTrack, SSEEvent } from '@/types';
import { TrackLibrary } from '@/components/TrackLibrary';
import { PlaylistPanel } from '@/components/PlaylistPanel';
import { NowPlayingBar } from '@/components/NowPlayingBar';
import { useSSE } from '@/hooks/useSSE';
import { ArrowUpDown, Download, Clock } from 'lucide-react';

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistTrack[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [autoSort, setAutoSort] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<PlaylistTrack[]>([]);

  // Fetch initial data
  useEffect(() => {
    Promise.all([
      fetch('/api/tracks').then(res => res.json()),
      fetch('/api/playlist').then(res => res.json())
    ]).then(([tracksData, playlistData]) => {
      setTracks(tracksData);
      setPlaylist(playlistData);
    });
  }, []);

  // Auto-sort by votes
  useEffect(() => {
    if (!autoSort) return;
    
    const sortedPlaylist = [...playlist].sort((a, b) => {
      // Sort by votes descending, then by position
      if (b.votes !== a.votes) return b.votes - a.votes;
      return a.position - b.position;
    });

    // Update positions if order changed
    const needsUpdate = sortedPlaylist.some((item, idx) => 
      item.id !== playlist[idx]?.id
    );

    if (needsUpdate) {
      sortedPlaylist.forEach((item, idx) => {
        const newPosition = idx + 1;
        if (item.position !== newPosition) {
          handleReorder(item.id, newPosition);
        }
      });
    }
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
      // Stop playing if no next track
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
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement) return;

      switch(e.key) {
        case ' ':
          e.preventDefault();
          // Toggle play/pause (will implement in NowPlayingBar)
          const playButton = document.querySelector('[data-play-toggle]') as HTMLButtonElement;
          playButton?.click();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkip();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          // Previous track
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

    console.log('SSE Event:', event);

    switch (event.type) {
      case 'track.added':
        setPlaylist(prev => {
          // Avoid duplicates
          if (prev.some(item => item.id === event.item.id)) return prev;
          return [...prev, event.item].sort((a, b) => a.position - b.position);
        });
        break;

      case 'track.removed':
        setPlaylist(prev => prev.filter(item => item.id !== event.id));
        break;

      case 'track.moved':
        setPlaylist(prev => prev.map(item =>
          item.id === event.item.id
            ? { ...item, position: event.item.position }
            : item
        ).sort((a, b) => a.position - b.position));
        break;

      case 'track.voted':
        setPlaylist(prev => prev.map(item =>
          item.id === event.item.id
            ? { ...item, votes: event.item.votes }
            : item
        ));
        break;

      case 'track.playing':
        setPlaylist(prev => {
          const updated = prev.map(item => ({
            ...item,
            is_playing: item.id === event.id
          }));
          
          // Track history when a track stops playing
          const stoppedPlaying = prev.find(item => 
            item.is_playing && item.id !== event.id
          );
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
    onConnectionChange: (connected) => {
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    }
  });

  // API Actions
  const handleAddTrack = async (trackId: string) => {
    const response = await fetch('/api/playlist', {
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
    await fetch(`/api/playlist/${id}`, {
      method: 'DELETE'
    });
  };

  const handleReorder = async (id: string, newPosition: number) => {
    // Optimistic update
    setPlaylist(prev => prev.map(item =>
      item.id === id ? { ...item, position: newPosition } : item
    ).sort((a, b) => a.position - b.position));

    try {
      await fetch(`/api/playlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newPosition })
      });
    } catch (error) {
      // Revert on error - refetch
      const playlistData = await fetch('/api/playlist').then(res => res.json());
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

  // Export playlist
  const handleExport = () => {
    const exportData = {
      name: 'My Playlist',
      created: new Date().toISOString(),
      tracks: playlist.map(item => ({
        title: item.track.title,
        artist: item.track.artist,
        album: item.track.album,
        votes: item.votes,
        position: item.position
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playlist-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent truncate">Realtime Collaborative Playlist</h1>
          <p className="text-xs sm:text-sm text-gray-600 truncate">Add, vote, and reorder tracks in realtime • Space: play/pause • ←/→: prev/next</p>
        </div>
        
        {/* Controls & Status */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Auto-sort toggle */}
          <button
            onClick={() => setAutoSort(!autoSort)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all transform hover:scale-105 ${
              autoSort 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50' 
                : 'bg-white/60 text-gray-700 hover:bg-white/80 shadow-md'
            }`}
            title="Auto-sort by votes"
          >
            <ArrowUpDown size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Auto-sort</span>
          </button>

          {/* History toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all transform hover:scale-105 ${
              showHistory 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50' 
                : 'bg-white/60 text-gray-700 hover:bg-white/80 shadow-md'
            }`}
            title="Show history"
          >
            <Clock size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">History ({history.length})</span>
          </button>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/60 text-gray-700 hover:bg-white/80 shadow-md transition-all transform hover:scale-105"
            title="Export playlist"
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              sseStatus === 'connected' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 
              sseStatus === 'connecting' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' : 
              'bg-red-500 shadow-lg shadow-red-500/50'
            }`} />
            <span className="text-xs sm:text-sm text-gray-600 capitalize hidden sm:inline">{sseStatus}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* Track Library */}
        <div className="hidden sm:block sm:w-1/3 border-r border-white/20 bg-white/40 backdrop-blur-md overflow-hidden">
          <TrackLibrary
            tracks={tracks}
            playlistTrackIds={playlistTrackIds}
            onAddTrack={handleAddTrack}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Playlist Panel */}
        <div className={`flex-1 bg-white/40 backdrop-blur-md overflow-hidden ${showHistory ? 'border-r border-white/20' : ''}`}>
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
          <div className="hidden lg:block w-80 bg-white/40 backdrop-blur-md overflow-y-auto border-l border-white/20">
            <div className="sticky top-0 bg-white/60 backdrop-blur-md border-b border-white/20 p-4">
              <h2 className="text-lg font-semibold text-gray-900">Recently Played</h2>
              <p className="text-sm text-gray-600 mt-1">Last {history.length} tracks</p>
            </div>
            <div className="p-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No history yet</p>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-3 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all transform hover:scale-[1.02] hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.track.cover_url || 'https://via.placeholder.com/48'}
                        alt={item.track.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {item.track.title}
                        </h4>
                        <p className="text-xs text-gray-600 truncate">
                          {item.track.artist}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {item.votes} votes
                          </span>
                        </div>
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
      <NowPlayingBar playlist={playlist} onSkip={handleSkip} />
    </div>
  );
}
