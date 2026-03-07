'use client';

import { useState } from 'react';

interface ShareModalProps {
  code: string;
  onClose: () => void;
}

export function ShareModal({ code, onClose }: ShareModalProps) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?code=${code}`
    : `/?code=${code}`;

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="relative w-full max-w-sm rounded-2xl p-7"
          style={{
            background: 'linear-gradient(135deg, rgba(13,13,26,0.99) 0%, rgba(20,10,35,0.99) 100%)',
            border: '1px solid rgba(168,85,247,0.45)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(168,85,247,0.15)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg transition-all hover:scale-110"
            style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="text-center mb-7">
            <div className="text-3xl mb-3">🔗</div>
            <h2
              className="text-xl font-bold mb-1"
              style={{ fontFamily: 'Syne, var(--font-syne), sans-serif', color: 'var(--text-primary)' }}
            >
              Invite Friends
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Share the code or link below to collaborate
            </p>
          </div>

          {/* Big Code Display */}
          <div
            className="rounded-xl p-5 mb-4 text-center"
            style={{
              background: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.3)',
            }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              ROOM CODE
            </p>
            <div
              className="text-5xl font-bold tracking-[0.3em] mb-1"
              style={{
                fontFamily: 'Syne, var(--font-syne), sans-serif',
                background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
              }}
            >
              {code}
            </div>
          </div>

          {/* Copy Code Button */}
          <button
            onClick={copyCode}
            className="w-full py-3 rounded-xl font-semibold text-sm mb-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: codeCopied
                ? 'linear-gradient(135deg, rgba(16,185,129,0.4), rgba(6,182,212,0.4))'
                : 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3))',
              border: `1px solid ${codeCopied ? 'rgba(16,185,129,0.6)' : 'rgba(168,85,247,0.5)'}`,
              color: codeCopied ? '#34d399' : 'white',
              fontFamily: 'Syne, var(--font-syne), sans-serif',
            }}
          >
            {codeCopied ? '✓ Code Copied!' : '⌗ Copy Code'}
          </button>

          {/* Copy Link Button */}
          <button
            onClick={copyLink}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: linkCopied
                ? 'rgba(16,185,129,0.12)'
                : 'rgba(6,182,212,0.1)',
              border: `1px solid ${linkCopied ? 'rgba(16,185,129,0.4)' : 'rgba(6,182,212,0.35)'}`,
              color: linkCopied ? '#34d399' : '#67e8f9',
              fontFamily: 'Syne, var(--font-syne), sans-serif',
            }}
          >
            {linkCopied ? '✓ Link Copied!' : '🔗 Copy Invite Link'}
          </button>

          {/* How to join hint */}
          <div
            className="mt-5 p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>How to join:</span> Open the app, click{' '}
              <span style={{ color: '#a855f7' }}>⌗ Join with Code</span>, and enter the 6-digit code above.
              All changes sync in real-time!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
