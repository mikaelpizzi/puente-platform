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

// Check if socket is enabled - allows complete disable via env var
const SOCKET_ENABLED = import.meta.env.VITE_ENABLE_SOCKET !== 'false';

/**
 * Custom hook for Socket.IO connection management.
 * Provides automatic reconnection and fallback to polling.
 *
 * Set VITE_ENABLE_SOCKET=false to completely disable socket connections.
 */
export function useSocket(options: UseSocketOptions = {}) {
  const {
    url = import.meta.env.VITE_WS_URL || 'http://localhost:3002',
    autoConnect = true,
    reconnectionAttempts = 5,
    onFallbackToPolling,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const isInitializedRef = useRef(false);

  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isReconnecting: false,
    useFallback: !SOCKET_ENABLED, // If disabled, mark as fallback mode
    socketId: null,
  });

  // Initialize socket connection - runs only once
  useEffect(() => {
    // Skip if socket is disabled or already initialized
    if (!SOCKET_ENABLED || !autoConnect || isInitializedRef.current) {
      if (!SOCKET_ENABLED) {
        console.log('[Socket] Socket disabled via VITE_ENABLE_SOCKET=false');
      }
      return;
    }

    isInitializedRef.current = true;

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
      setState({
        isConnected: true,
        isReconnecting: false,
        useFallback: false,
        socketId: socket.id ?? null,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setState((prev) => ({
        ...prev,
        isConnected: false,
        socketId: null,
      }));
    });

    let errorCount = 0;
    socket.on('connect_error', (error) => {
      errorCount++;

      // Only log the first error
      if (errorCount === 1) {
        console.error('[Socket] Connection error:', error.message);
      }

      if (errorCount >= reconnectionAttempts) {
        console.warn('[Socket] Max reconnection attempts reached, disabling socket');
        setState({
          isConnected: false,
          isReconnecting: false,
          useFallback: true,
          socketId: null,
        });
        onFallbackToPolling?.();
        socket.disconnect();
        socket.off(); // Remove all listeners
      } else {
        setState((prev) => ({
          ...prev,
          isReconnecting: true,
        }));
      }
    });

    socket.io.on('reconnect', () => {
      console.log('[Socket] Reconnected');
      errorCount = 0;
      setState({
        isConnected: true,
        isReconnecting: false,
        useFallback: false,
        socketId: socket.id ?? null,
      });
    });

    socket.on('heartbeat', () => {
      socket.emit('pong');
    });

    return () => {
      socket.off();
      socket.disconnect();
      socketRef.current = null;
      // Don't reset isInitializedRef to prevent re-initialization on StrictMode remount
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
    if (!SOCKET_ENABLED) return;
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
