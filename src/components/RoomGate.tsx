'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RoomGate() {
  const router = useRouter();
  const [mode, setMode] = useState<'home' | 'join'>('home');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create room');
      const { code } = await res.json();
      router.push(`/?code=${code}`);
    } catch {
      setError('Failed to create a room. Please try again.');
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = joinCode.replace(/\D/g, '').slice(0, 6);
    if (cleaned.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/rooms/${cleaned}`);
      if (res.status === 404) {
        setError('Room not found. Check the code and try again.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to validate room');
      router.push(`/?code=${cleaned}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#070711' }}
    >
      {/* Animated background blobs */}
      <div className="bg-blobs">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🎵</div>
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              fontFamily: 'Syne, var(--font-syne), sans-serif',
              background: 'linear-gradient(90deg, #a855f7, #06b6d4, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Collab Playlist
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            Add · Vote · Reorder in realtime
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(168,85,247,0.25)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 60px rgba(168,85,247,0.08)',
          }}
        >
          {mode === 'home' ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2
                  className="text-xl font-bold mb-1"
                  style={{ fontFamily: 'Syne, var(--font-syne), sans-serif', color: 'var(--text-primary)' }}
                >
                  Get Started
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Create a new room or join an existing one with a code
                </p>
              </div>

              {/* Create Room */}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-4 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  color: 'white',
                  boxShadow: '0 0 30px rgba(168,85,247,0.4)',
                  fontFamily: 'Syne, var(--font-syne), sans-serif',
                  letterSpacing: '0.02em',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating…
                  </span>
                ) : (
                  '✦ Create New Room'
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Join Room */}
              <button
                onClick={() => { setMode('join'); setError(''); }}
                disabled={loading}
                className="w-full py-4 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: 'rgba(6,182,212,0.1)',
                  border: '1px solid rgba(6,182,212,0.4)',
                  color: '#67e8f9',
                  fontFamily: 'Syne, var(--font-syne), sans-serif',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(6,182,212,0.18)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(6,182,212,0.25)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(6,182,212,0.1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                ⌗ Join with Code
              </button>

              {error && (
                <p className="text-center text-xs mt-2" style={{ color: '#fb7185' }}>{error}</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => { setMode('home'); setError(''); setJoinCode(''); }}
                  className="p-1.5 rounded-lg transition-all hover:scale-110"
                  style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: 'Syne, var(--font-syne), sans-serif', color: 'var(--text-primary)' }}
                >
                  Join a Room
                </h2>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Enter the 6-digit room code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="e.g. 847392"
                  value={joinCode}
                  onChange={e => {
                    setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  className="neon-input w-full px-4 py-3 rounded-xl text-lg font-bold text-center tracking-[0.4em]"
                  style={{
                    fontFamily: 'Syne, var(--font-syne), sans-serif',
                    fontSize: '1.5rem',
                  }}
                  autoFocus
                />
              </div>

              {error && (
                <p
                  className="text-xs text-center px-3 py-2 rounded-lg"
                  style={{ color: '#fb7185', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || joinCode.length !== 6}
                className="w-full py-4 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: joinCode.length === 6
                    ? 'linear-gradient(135deg, #06b6d4, #a855f7)'
                    : 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontFamily: 'Syne, var(--font-syne), sans-serif',
                  boxShadow: joinCode.length === 6 ? '0 0 25px rgba(6,182,212,0.35)' : 'none',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Joining…
                  </span>
                ) : (
                  'Join Room →'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Each room has its own playlist · Share the code to invite friends
        </p>
      </div>
    </div>
  );
}
