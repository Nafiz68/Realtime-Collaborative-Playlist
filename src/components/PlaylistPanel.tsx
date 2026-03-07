'use client';

import { PlaylistTrack } from '@/types';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PlaylistItem } from './PlaylistItem';
import { calculatePosition } from '@/lib/calculatePosition';
import { motion, AnimatePresence } from 'framer-motion';

interface PlaylistPanelProps {
  playlist: PlaylistTrack[];
  onVote: (id: string, direction: 'up' | 'down') => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onReorder: (id: string, newPosition: number) => Promise<void>;
  onPlay: (id: string) => Promise<void>;
  autoSort?: boolean;
}

export function PlaylistPanel({ playlist, onVote, onRemove, onReorder, onPlay, autoSort }: PlaylistPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = playlist.findIndex(item => item.id === active.id);
    const newIndex = playlist.findIndex(item => item.id === over.id);

    if (oldIndex === newIndex) return;

    // Calculate new position based on neighbors
    const prevTrack = newIndex > 0 ? playlist[newIndex - (newIndex > oldIndex ? 0 : 1)] : null;
    const nextTrack = newIndex < playlist.length - 1 ? playlist[newIndex + (newIndex > oldIndex ? 1 : 0)] : null;

    const newPosition = calculatePosition(
      prevTrack?.position ?? null,
      nextTrack?.position ?? null
    );

    await onReorder(active.id as string, newPosition);
  };

  const totalDuration = playlist.reduce((sum, item) => sum + item.track.duration_seconds, 0);
  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div
        className="flex-shrink-0 p-4 border-b"
        style={{
          borderColor: 'rgba(168,85,247,0.15)',
          background: 'linear-gradient(90deg, rgba(168,85,247,0.06) 0%, rgba(6,182,212,0.04) 50%, rgba(236,72,153,0.06) 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{
              fontFamily: 'Syne, sans-serif',
              background: 'linear-gradient(90deg, #a855f7, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Queue
          </h2>
          {autoSort && (
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3))',
                border: '1px solid rgba(168,85,247,0.4)',
                color: '#d8b4fe',
              }}
            >
              ⚡ Auto-sort
            </span>
          )}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {playlist.length} {playlist.length === 1 ? 'track' : 'tracks'}
          {playlist.length > 0 && ` · ${formatTotalDuration(totalDuration)}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-visible py-2">
        {playlist.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6">
              <div
                className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))',
                  border: '1px solid rgba(168,85,247,0.3)',
                  boxShadow: '0 0 30px rgba(168,85,247,0.15)',
                }}
              >
                <svg className="w-10 h-10" style={{ color: 'var(--neon-purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Queue is empty</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add tracks from the library to get started</p>
            </div>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={playlist.map(item => item.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence mode="popLayout">
                {playlist.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ 
                      layout: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                  >
                    <PlaylistItem
                      item={item}
                      onVote={onVote}
                      onRemove={onRemove}
                      onPlay={onPlay}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

