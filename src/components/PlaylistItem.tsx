'use client';

import { PlaylistTrack } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PlaylistItemProps {
  item: PlaylistTrack;
  onVote: (id: string, direction: 'up' | 'down') => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onPlay: (id: string) => Promise<void>;
}

export function PlaylistItem({ item, onVote, onRemove, onPlay }: PlaylistItemProps) {
  const [voting, setVoting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleVote = async (direction: 'up' | 'down') => {
    setVoting(true);
    try {
      await onVote(item.id, direction);
    } finally {
      setVoting(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(item.id);
    } catch {
      setRemoving(false);
    }
  };

  const handlePlay = async (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-drag-handle]')) {
      return;
    }
    
    if (!item.is_playing) {
      await onPlay(item.id);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const voteColor = item.votes > 0 ? '#10b981' : item.votes < 0 ? '#f43f5e' : 'var(--text-muted)';

  const baseStyle = item.is_playing
    ? {
        ...style,
        background: 'linear-gradient(90deg, rgba(168,85,247,0.1) 0%, rgba(6,182,212,0.08) 50%, rgba(236,72,153,0.1) 100%)',
        border: '1px solid rgba(168,85,247,0.35)',
        boxShadow: '0 0 20px rgba(168,85,247,0.08), inset 0 0 15px rgba(168,85,247,0.03)',
      }
    : {
        ...style,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      };

  return (
    <div
      ref={setNodeRef}
      style={baseStyle}
      onClick={handlePlay}
      className={`group relative flex items-center gap-3 p-3 mx-2 my-1.5 rounded-xl transition-all cursor-pointer ${isDragging ? 'scale-105' : ''} ${showPreview ? 'z-50' : ''}`}
      onMouseEnter={e => {
        if (!item.is_playing) {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(168,85,247,0.08)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.3)';
        }
      }}
      onMouseLeave={e => {
        if (!item.is_playing) {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
        }
      }}
    >
      {/* Hover track preview portal */}
      {showPreview && createPortal(
        <AnimatePresence>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[9998] pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-1/2 left-1/2 z-[9999] w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl p-5 pointer-events-none"
              style={{
                transform: 'translate(-50%, -50%)',
                background: 'linear-gradient(135deg, rgba(13,13,26,0.98) 0%, rgba(20,10,35,0.98) 100%)',
                border: '1px solid rgba(168,85,247,0.4)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(168,85,247,0.2)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex gap-4">
                {item.track.cover_url ? (
                  <img
                    src={item.track.cover_url}
                    alt={`${item.track.album} cover`}
                    className="w-20 h-20 rounded-xl flex-shrink-0 object-cover"
                    style={{
                      border: '1px solid rgba(168,85,247,0.4)',
                      boxShadow: '0 0 20px rgba(168,85,247,0.3)',
                    }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl font-bold"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(236,72,153,0.4))',
                      border: '1px solid rgba(168,85,247,0.4)',
                      fontFamily: 'Syne, sans-serif',
                      color: 'white',
                    }}
                  >
                    {item.track.title.slice(0, 1)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-base mb-1 truncate"
                    style={{
                      background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontFamily: 'Syne, sans-serif',
                    }}
                  >
                    {item.track.title}
                  </h3>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{item.track.artist}</p>
                  <div className="space-y-0.5">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>💿 {item.track.album}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>🎵 {item.track.genre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>⏱️ {formatDuration(item.track.duration_seconds)}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: item.votes > 0
                          ? 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,182,212,0.3))'
                          : item.votes < 0
                          ? 'linear-gradient(135deg, rgba(244,63,94,0.3), rgba(236,72,153,0.3))'
                          : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${item.votes > 0 ? 'rgba(16,185,129,0.5)' : item.votes < 0 ? 'rgba(244,63,94,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        color: item.votes > 0 ? '#34d399' : item.votes < 0 ? '#fb7185' : 'var(--text-muted)',
                      }}
                    >
                      {item.votes > 0 && '+'}{item.votes} votes
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>👤 {item.added_by}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        </AnimatePresence>,
        document.body
      )}

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        data-drag-handle
        className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(168,85,247,0.2)';
          (e.currentTarget as HTMLDivElement).style.color = '#a855f7';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
          (e.currentTarget as HTMLDivElement).style.color = 'var(--text-muted)';
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Now Playing Indicator */}
      {item.is_playing && (
        <div className="equalizer flex-shrink-0">
          <div className="eq-bar" />
          <div className="eq-bar" />
          <div className="eq-bar" />
          <div className="eq-bar" />
        </div>
      )}

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div
          className="font-semibold text-sm truncate"
          style={{ color: item.is_playing ? '#d8b4fe' : 'var(--text-primary)' }}
        >
          {item.track.title}
        </div>
        <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{item.track.artist}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatDuration(item.track.duration_seconds)} · {item.added_by}
        </div>
      </div>

      {/* Voting */}
      <div
        className="flex flex-col items-center gap-0.5"
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        <button
          onClick={() => handleVote('up')}
          disabled={voting}
          className="p-1.5 rounded-lg transition-all hover:scale-110 disabled:opacity-40"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.2)';
            (e.currentTarget as HTMLButtonElement).style.color = '#34d399';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
          aria-label="Upvote"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[2rem] text-center"
          style={{
            color: voteColor,
            background: item.votes > 0
              ? 'rgba(16,185,129,0.12)'
              : item.votes < 0
              ? 'rgba(244,63,94,0.12)'
              : 'rgba(255,255,255,0.05)',
            border: `1px solid ${item.votes > 0 ? 'rgba(16,185,129,0.25)' : item.votes < 0 ? 'rgba(244,63,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {item.votes > 0 && '+'}{item.votes}
        </span>
        <button
          onClick={() => handleVote('down')}
          disabled={voting}
          className="p-1.5 rounded-lg transition-all hover:scale-110 disabled:opacity-40"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.2)';
            (e.currentTarget as HTMLButtonElement).style.color = '#fb7185';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
          aria-label="Downvote"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Remove Button */}
      <button
        onClick={handleRemove}
        disabled={removing}
        className="p-2 rounded-lg transition-all hover:scale-110 disabled:opacity-50 opacity-0 group-hover:opacity-100"
        style={{ color: '#f43f5e' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.15)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 12px rgba(244,63,94,0.3)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
        }}
        aria-label="Remove track"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
