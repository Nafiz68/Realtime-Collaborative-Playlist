'use client';

import { PlaylistTrack } from '@/types';
import { useEffect, useState } from 'react';

interface NowPlayingBarProps {
  playlist: PlaylistTrack[];
  onSkip: () => Promise<void>;
}

export function NowPlayingBar({ playlist, onSkip }: NowPlayingBarProps) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [manualProgress, setManualProgress] = useState<number | null>(null);

  const currentTrack = playlist.find(item => item.is_playing);

  // Reset progress when track changes
  useEffect(() => {
    if (currentTrack) {
      setProgress(0);
      setManualProgress(null);
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!currentTrack || isPaused) {
      return;
    }

    const duration = currentTrack.track.duration_seconds * 1000;
    const startTime = Date.now();
    const startProgress = manualProgress ?? 0;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(startProgress + (elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        // Auto-advance to next track
        onSkip();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentTrack, isPaused, onSkip, manualProgress]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentTrack) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    
    setManualProgress(newProgress);
    setProgress(newProgress);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentTime = () => {
    if (!currentTrack) return '0:00';
    const elapsed = Math.floor((progress / 100) * currentTrack.track.duration_seconds);
    return formatDuration(elapsed);
  };

  if (!currentTrack) {
    return (
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(7,7,17,0.95) 0%, rgba(13,13,26,0.98) 100%)',
          borderTop: '1px solid rgba(168,85,247,0.15)',
          backdropFilter: 'blur(20px)',
        }}
        className="p-4 flex items-center justify-center gap-3"
      >
        <div className="equalizer" style={{ opacity: 0.3 }}>
          <div className="eq-bar" style={{ animationPlayState: 'paused' }} />
          <div className="eq-bar" style={{ animationPlayState: 'paused' }} />
          <div className="eq-bar" style={{ animationPlayState: 'paused' }} />
          <div className="eq-bar" style={{ animationPlayState: 'paused' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No track playing — select one from the playlist</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(7,7,17,0.97) 0%, rgba(20,10,35,0.98) 50%, rgba(7,7,17,0.97) 100%)',
        borderTop: '1px solid rgba(168,85,247,0.25)',
        backdropFilter: 'blur(30px)',
        boxShadow: '0 -10px 40px rgba(168,85,247,0.08)',
      }}
      className="p-4"
    >
      <div className="max-w-7xl mx-auto">
        {/* Track Info Row */}
        <div className="flex items-center gap-4 mb-3">
          {/* Album art placeholder with neon glow */}
          <div
            className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl font-bold select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(236,72,153,0.4))',
              border: '1px solid rgba(168,85,247,0.5)',
              boxShadow: '0 0 20px rgba(168,85,247,0.3)',
              fontFamily: 'Syne, sans-serif',
              color: 'white',
            }}
          >
            {currentTrack.track.title.slice(0, 1)}
          </div>

          <div className="flex-1 min-w-0">
            <div
              className="font-bold text-base truncate"
              style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}
            >
              {currentTrack.track.title}
            </div>
            <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
              {currentTrack.track.artist}
            </div>
          </div>

          {/* Now playing indicator */}
          <div className="equalizer mx-2 hidden sm:flex">
            <div className="eq-bar" style={{ animationPlayState: isPaused ? 'paused' : 'running' }} />
            <div className="eq-bar" style={{ animationPlayState: isPaused ? 'paused' : 'running' }} />
            <div className="eq-bar" style={{ animationPlayState: isPaused ? 'paused' : 'running' }} />
            <div className="eq-bar" style={{ animationPlayState: isPaused ? 'paused' : 'running' }} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3))',
                border: '1px solid rgba(168,85,247,0.5)',
                boxShadow: isPaused ? '0 0 20px rgba(168,85,247,0.5)' : '0 0 12px rgba(168,85,247,0.2)',
                color: 'white',
              }}
              aria-label={isPaused ? 'Play' : 'Pause'}
              data-play-toggle="true"
            >
              {isPaused ? (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              )}
            </button>

            <button
              onClick={onSkip}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.5)';
                (e.currentTarget as HTMLButtonElement).style.color = 'white';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              aria-label="Skip to next"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4l12 8-12 8V4zm13 0v16h2V4h-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs w-10 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {getCurrentTime()}
          </span>
          <div
            onClick={handleProgressClick}
            className="flex-1 h-1.5 rounded-full overflow-hidden cursor-pointer group relative"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100 ease-linear"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
                boxShadow: '0 0 10px rgba(168,85,247,0.6)',
              }}
            />
            {/* Thumb dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                left: `calc(${progress}% - 6px)`,
                background: 'white',
                boxShadow: '0 0 8px rgba(168,85,247,0.8)',
              }}
            />
          </div>
          <span className="text-xs w-10 tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {formatDuration(currentTrack.track.duration_seconds)}
          </span>
        </div>
      </div>
    </div>
  );
}

