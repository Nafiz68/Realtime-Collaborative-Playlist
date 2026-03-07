'use client';

import { Track } from '@/types';
import { useState, useRef, useEffect } from 'react';

interface TrackLibraryProps {
  tracks: Track[];
  playlistTrackIds: Set<string>;
  onAddTrack: (trackId: string) => Promise<void>;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function TrackLibrary({ tracks, playlistTrackIds, onAddTrack, searchTerm, onSearchChange }: TrackLibraryProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  const genres = ['All', ...Array.from(new Set(tracks.map(t => t.genre)))];

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || track.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  // Get suggestions - top 5 matches
  const suggestions = searchTerm.trim() ? filteredTracks.slice(0, 5) : [];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const track = suggestions[selectedSuggestionIndex];
      onSearchChange(track.title);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleAddTrack = async (trackId: string) => {
    setAddingTrackId(trackId);
    try {
      await onAddTrack(trackId);
    } finally {
      setAddingTrackId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Library Header */}
      <div
        className="flex-shrink-0 p-4 border-b"
        style={{
          borderColor: 'rgba(168,85,247,0.15)',
          background: 'linear-gradient(90deg, rgba(6,182,212,0.06) 0%, rgba(168,85,247,0.06) 100%)',
        }}
      >
        <h2
          className="text-lg font-bold mb-3"
          style={{
            fontFamily: 'Syne, sans-serif',
            background: 'linear-gradient(90deg, #06b6d4, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Library
        </h2>
        
        {/* Search */}
        <div ref={searchRef} className="relative mb-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tracks or artists..."
              value={searchTerm}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSuggestions(true);
                setSelectedSuggestionIndex(-1);
              }}
              onFocus={() => searchTerm && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              className="neon-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium"
            />
          </div>

          {/* Auto-suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="absolute top-full mt-1 w-full rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto"
              style={{
                background: 'rgba(13,13,26,0.98)',
                border: '1px solid rgba(168,85,247,0.35)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(168,85,247,0.1)',
              }}
            >
              {suggestions.map((track, index) => (
                <div
                  key={track.id}
                  onClick={() => {
                    onSearchChange(track.title);
                    setShowSuggestions(false);
                    setSelectedSuggestionIndex(-1);
                  }}
                  className="p-3 cursor-pointer transition-all"
                  style={{
                    background: index === selectedSuggestionIndex
                      ? 'linear-gradient(90deg, rgba(168,85,247,0.2), rgba(6,182,212,0.15))'
                      : 'transparent',
                    borderBottom: index !== suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (index !== selectedSuggestionIndex) {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(168,85,247,0.1)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (index !== selectedSuggestionIndex) {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    }
                  }}
                >
                  <div
                    className="font-medium text-sm"
                    style={{ color: index === selectedSuggestionIndex ? '#d8b4fe' : 'var(--text-primary)' }}
                  >
                    {track.title}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: index === selectedSuggestionIndex ? '#a5b4fc' : 'var(--text-muted)' }}
                  >
                    {track.artist} · {track.album}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Genre Pills */}
        <div className="flex gap-1.5 flex-wrap">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                selectedGenre === genre ? 'genre-pill-active' : 'genre-pill'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
            <div className="text-2xl">🔍</div>
            <p className="text-xs text-center">No tracks found.<br />Try a different search.</p>
          </div>
        ) : (
          filteredTracks.map(track => {
            const inPlaylist = playlistTrackIds.has(track.id);
            const isAdding = addingTrackId === track.id;

            return (
              <div
                key={track.id}
                className="group flex items-center gap-3 p-3 mx-2 my-1 rounded-xl transition-all cursor-default"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(168,85,247,0.06)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)';
                }}
              >
                {/* Track letter avatar */}
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold select-none"
                  style={{
                    background: inPlaylist
                      ? 'rgba(168,85,247,0.15)'
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${inPlaylist ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    color: inPlaylist ? '#a855f7' : 'var(--text-muted)',
                  }}
                >
                  {track.title.slice(0, 1)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs truncate" style={{ color: 'var(--text-primary)' }}>{track.title}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{track.artist}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {track.album} · {formatDuration(track.duration_seconds)}
                  </div>
                </div>

                <button
                  onClick={() => handleAddTrack(track.id)}
                  disabled={inPlaylist || isAdding}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed"
                  style={
                    inPlaylist
                      ? {
                          background: 'rgba(168,85,247,0.1)',
                          border: '1px solid rgba(168,85,247,0.2)',
                          color: 'rgba(168,85,247,0.5)',
                        }
                      : isAdding
                      ? {
                          background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(6,182,212,0.4))',
                          border: '1px solid rgba(168,85,247,0.5)',
                          color: 'white',
                        }
                      : {
                          background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))',
                          border: '1px solid rgba(6,182,212,0.4)',
                          color: '#67e8f9',
                          boxShadow: '0 0 0 0 rgba(6,182,212,0.4)',
                        }
                  }
                  onMouseEnter={e => {
                    if (!inPlaylist && !isAdding) {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 15px rgba(6,182,212,0.3)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(6,182,212,0.35), rgba(168,85,247,0.35))';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!inPlaylist && !isAdding) {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                      (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))';
                    }
                  }}
                >
                  {inPlaylist ? '✓ Added' : isAdding ? '...' : '+ Add'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
