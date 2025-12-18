import { useEffect, useState, useCallback } from 'react';
import {
  initializeSocket,
  getConnectionState,
  subscribeToState,
  emit as socketEmit,
  on as socketOn,
} from '../lib/socketManager';

interface SocketState {
  isConnected: boolean;
  isReconnecting: boolean;
  useFallback: boolean;
  socketId: string | null;
}

/**
 * Hook to use the singleton socket manager.
 * The socket is initialized once globally, not per component.
 */
export function useSocket() {
  const [state, setState] = useState<SocketState>(getConnectionState);

  // Initialize socket on first use (singleton - runs once globally)
  useEffect(() => {
    initializeSocket();

    // Subscribe to state changes
    const unsubscribe = subscribeToState((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  // Join a room
  const joinRoom = useCallback((event: string, data: Record<string, string>) => {
    socketEmit(event, data);
  }, []);

  // Leave a room
  const leaveRoom = useCallback((event: string, data: Record<string, string>) => {
    socketEmit(event, data);
  }, []);

  // Subscribe to an event
  const subscribe = useCallback((event: string, handler: (data: unknown) => void) => {
    return socketOn(event, handler);
  }, []);

  // Emit an event
  const emit = useCallback((event: string, data: unknown) => {
    socketEmit(event, data);
  }, []);

  return {
    ...state,
    joinRoom,
    leaveRoom,
    subscribe,
    emit,
  };
}

export default useSocket;
