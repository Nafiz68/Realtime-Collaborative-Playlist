// SSE Client Hook with Reconnection Logic
import { useEffect, useCallback, useRef, useState } from 'react';
import type { SSEEvent } from '@/types';

interface UseSSEOptions {
  onEvent: (event: SSEEvent) => void;
  onConnectionChange?: (connected: boolean) => void;
  roomCode: string;
}

export function useSSE({ onEvent, onConnectionChange, roomCode }: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountingRef = useRef(false);
  const connectionOpenTimeRef = useRef<number>(0);
  
  // Store callbacks in refs to prevent recreating connect function
  const onEventRef = useRef(onEvent);
  const onConnectionChangeRef = useRef(onConnectionChange);
  
  // Update refs when callbacks change
  useEffect(() => {
    onEventRef.current = onEvent;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onEvent, onConnectionChange]);

  const connect = useCallback(() => {
    // Don't reconnect if component is unmounting
    if (isUnmountingRef.current) {
      return;
    }

    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    // Connect to room-scoped SSE stream
    const eventSource = new EventSource(`/api/stream?code=${roomCode}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`SSE connection opened for room ${roomCode}`);
      setConnectionStatus('connected');
      onConnectionChangeRef.current?.(true);
      reconnectAttemptsRef.current = 0;
      connectionOpenTimeRef.current = Date.now();
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        onEventRef.current(data);
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
      }
    };

    eventSource.onerror = () => {
      // Don't reconnect if component is unmounting or connection was very short-lived
      const connectionDuration = Date.now() - connectionOpenTimeRef.current;
      if (isUnmountingRef.current || connectionDuration < 100) {
        console.log('SSE connection closed (component unmounting or too quick)');
        eventSource.close();
        return;
      }

      console.error('SSE connection error');
      eventSource.close();
      setConnectionStatus('disconnected');
      onConnectionChangeRef.current?.(false);

      // Exponential backoff for reconnection
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;
      
      console.log(`Reconnecting in ${backoffDelay}ms (attempt ${reconnectAttemptsRef.current})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isUnmountingRef.current) {
          connect();
        }
      }, backoffDelay);
    };
  }, [roomCode]);

  useEffect(() => {
    isUnmountingRef.current = false;
    connect();

    return () => {
      isUnmountingRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return { connectionStatus, reconnect: connect };
}
