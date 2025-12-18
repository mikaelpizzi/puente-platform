/**
 * Socket Manager - Singleton Pattern
 *
 * This module manages the Socket.IO connection as a singleton,
 * completely outside of React's lifecycle to prevent re-initialization issues.
 *
 * Usage:
 * - In development: Socket tries to connect automatically
 * - In production: Socket is disabled by default (no logs, no retries)
 */

import { io, Socket } from 'socket.io-client';

// Determine if socket should be enabled
const isProduction = import.meta.env.PROD;
const explicitEnable = import.meta.env.VITE_ENABLE_SOCKET === 'true';
const explicitDisable = import.meta.env.VITE_ENABLE_SOCKET === 'false';

// In production: disabled unless explicitly enabled
// In development: enabled unless explicitly disabled
const SOCKET_ENABLED = isProduction ? explicitEnable : !explicitDisable;

// Singleton state
let socket: Socket | null = null;
let isInitialized = false;
let hasGivenUp = false;
let connectionState = {
  isConnected: false,
  isReconnecting: false,
  useFallback: false,
  socketId: null as string | null,
};

// Subscribers for state changes
const subscribers = new Set<(state: typeof connectionState) => void>();

function notifySubscribers() {
  subscribers.forEach((callback) => callback({ ...connectionState }));
}

function updateState(partial: Partial<typeof connectionState>) {
  connectionState = { ...connectionState, ...partial };
  notifySubscribers();
}

/**
 * Initialize the socket connection (called once on app start)
 */
export function initializeSocket(): void {
  // Guard: Only initialize once
  if (isInitialized) return;
  isInitialized = true;

  // Guard: Don't connect if disabled
  if (!SOCKET_ENABLED) {
    if (!isProduction) {
      console.log('[SocketManager] Socket disabled via VITE_ENABLE_SOCKET');
    }
    updateState({ useFallback: true });
    return;
  }

  const url = import.meta.env.VITE_WS_URL || 'http://localhost:3002';
  const maxAttempts = 3;
  let attempts = 0;

  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: maxAttempts,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    attempts = 0;
    hasGivenUp = false;
    updateState({
      isConnected: true,
      isReconnecting: false,
      useFallback: false,
      socketId: socket?.id ?? null,
    });
  });

  socket.on('disconnect', (reason) => {
    console.log('[SocketManager] Disconnected:', reason);
    updateState({
      isConnected: false,
      socketId: null,
    });
  });

  socket.on('connect_error', (error) => {
    if (hasGivenUp) return; // Already given up, ignore

    attempts++;

    if (attempts === 1) {
      console.warn('[SocketManager] Connection failed:', error.message);
    }

    if (attempts >= maxAttempts) {
      hasGivenUp = true;
      console.warn('[SocketManager] Max attempts reached. Socket disabled.');
      updateState({
        isConnected: false,
        isReconnecting: false,
        useFallback: true,
      });
      socket?.disconnect();
      socket?.removeAllListeners();
    } else {
      updateState({ isReconnecting: true });
    }
  });

  socket.on('heartbeat', () => {
    socket?.emit('pong');
  });
}

/**
 * Get the current socket instance (may be null if disabled)
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Get current connection state
 */
export function getConnectionState() {
  return { ...connectionState };
}

/**
 * Subscribe to state changes
 */
export function subscribeToState(callback: (state: typeof connectionState) => void): () => void {
  subscribers.add(callback);
  // Immediately call with current state
  callback({ ...connectionState });
  return () => subscribers.delete(callback);
}

/**
 * Emit an event
 */
export function emit(event: string, data: unknown): void {
  socket?.emit(event, data);
}

/**
 * Subscribe to a socket event
 */
export function on(event: string, handler: (data: unknown) => void): () => void {
  socket?.on(event, handler);
  return () => {
    socket?.off(event, handler);
  };
}

/**
 * Cleanup (call on app unmount if needed)
 */
export function cleanup(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  isInitialized = false;
  hasGivenUp = false;
}
