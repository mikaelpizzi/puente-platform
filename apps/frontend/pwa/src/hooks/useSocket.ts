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

  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isReconnecting: false,
    useFallback: false,
    socketId: null,
  });

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

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
      console.error('[Socket] Connection error:', error.message);
      reconnectAttemptsRef.current++;

      if (reconnectAttemptsRef.current >= reconnectionAttempts) {
        console.warn('[Socket] Max reconnection attempts reached, falling back to polling');
        setState((prev) => ({
          ...prev,
          isReconnecting: false,
          useFallback: true,
        }));
        onFallbackToPolling?.();
        socket.disconnect();
      } else {
        setState((prev) => ({
          ...prev,
          isReconnecting: true,
        }));
      }
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket] Reconnection attempt ${attempt}`);
      setState((prev) => ({ ...prev, isReconnecting: true }));
    });

    socket.io.on('reconnect', () => {
      console.log('[Socket] Reconnected');
      reconnectAttemptsRef.current = 0;
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
  }, [url, autoConnect, reconnectionAttempts, onFallbackToPolling]);

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
