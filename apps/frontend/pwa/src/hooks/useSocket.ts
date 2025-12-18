import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  /** WebSocket server URL */
  url?: string;
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Reconnection attempts before fallback */
  reconnectionAttempts?: number;
  /** Callback when fallback to polling is needed */
  onFallbackToPolling?: () => void;
}

interface SocketState {
  isConnected: boolean;
  isReconnecting: boolean;
  useFallback: boolean;
  socketId: string | null;
}

/**
 * Custom hook for Socket.IO connection management.
 * Provides automatic reconnection and fallback to polling.
 */
export function useSocket(options: UseSocketOptions = {}) {
  const {
    url = import.meta.env.VITE_WS_URL || 'http://localhost:3002',
    autoConnect = true,
    reconnectionAttempts = 5,
    onFallbackToPolling,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  // Store callback in ref to avoid useEffect dependency
  const onFallbackRef = useRef(onFallbackToPolling);
  // Track if we've already given up to prevent infinite retries
  const hasGivenUpRef = useRef(false);

  // Keep ref in sync with latest callback
  useEffect(() => {
    onFallbackRef.current = onFallbackToPolling;
  }, [onFallbackToPolling]);

  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isReconnecting: false,
    useFallback: false,
    socketId: null,
  });

  // Initialize socket connection - runs only once on mount
  useEffect(() => {
    if (!autoConnect) return;

    // If we've already given up, don't try to connect again
    if (hasGivenUpRef.current) {
      return;
    }

    const socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      reconnectAttemptsRef.current = 0;
      hasGivenUpRef.current = false;
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        useFallback: false,
        socketId: socket.id ?? null,
      }));
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setState((prev) => ({
        ...prev,
        isConnected: false,
        socketId: null,
      }));
    });

    socket.on('connect_error', (error) => {
      // Only log once per connection attempt cycle
      if (reconnectAttemptsRef.current === 0) {
        console.error('[Socket] Connection error:', error.message);
      }
      reconnectAttemptsRef.current++;

      if (reconnectAttemptsRef.current >= reconnectionAttempts) {
        // Mark as given up to prevent further connection attempts
        hasGivenUpRef.current = true;

        console.warn('[Socket] Max reconnection attempts reached, falling back to polling');
        setState((prev) => ({
          ...prev,
          isReconnecting: false,
          useFallback: true,
        }));

        // Use ref to call callback without causing re-render loop
        onFallbackRef.current?.();

        // Disconnect and stop all reconnection attempts
        socket.disconnect();
      } else {
        setState((prev) => ({
          ...prev,
          isReconnecting: true,
        }));
      }
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      // Only log if we haven't given up
      if (!hasGivenUpRef.current) {
        console.log(`[Socket] Reconnection attempt ${attempt}`);
        setState((prev) => ({ ...prev, isReconnecting: true }));
      }
    });

    socket.io.on('reconnect', () => {
      console.log('[Socket] Reconnected');
      reconnectAttemptsRef.current = 0;
      hasGivenUpRef.current = false;
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        useFallback: false,
      }));
    });

    // Heartbeat handler
    socket.on('heartbeat', () => {
      socket.emit('pong');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // Intentionally exclude onFallbackToPolling - using ref instead
  }, [url, autoConnect, reconnectionAttempts]);

  // Join a room
  const joinRoom = useCallback((event: string, data: Record<string, string>) => {
    socketRef.current?.emit(event, data);
  }, []);

  // Leave a room
  const leaveRoom = useCallback((event: string, data: Record<string, string>) => {
    socketRef.current?.emit(event, data);
  }, []);

  // Subscribe to an event
  const subscribe = useCallback((event: string, handler: (data: unknown) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  // Emit an event
  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  // Manual connect
  const connect = useCallback(() => {
    // Reset the given up flag to allow manual reconnection
    hasGivenUpRef.current = false;
    reconnectAttemptsRef.current = 0;
    socketRef.current?.connect();
  }, []);

  // Manual disconnect
  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return {
    socket: socketRef.current,
    ...state,
    joinRoom,
    leaveRoom,
    subscribe,
    emit,
    connect,
    disconnect,
  };
}

export default useSocket;
