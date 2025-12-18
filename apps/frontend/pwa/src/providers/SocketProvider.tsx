import { createContext, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';

interface RootState {
  auth?: {
    user?: {
      id?: string;
    };
  };
}

interface SocketContextValue {
  isConnected: boolean;
  isReconnecting: boolean;
  useFallback: boolean;
  socketId: string | null;
  joinRoom: (event: string, data: Record<string, string>) => void;
  leaveRoom: (event: string, data: Record<string, string>) => void;
  subscribe: (event: string, handler: (data: unknown) => void) => () => void;
  emit: (event: string, data: unknown) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app with Socket.IO connection.
 * Automatically subscribes to user notifications when authenticated.
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const dispatch = useDispatch();

  // Get user ID from auth state
  const userId = useSelector((state: RootState) => state.auth?.user?.id);

  // IMPORTANT: Memoize callback to prevent socket reconnection loop
  // Without useCallback, a new function reference would trigger useSocket
  // to disconnect and reconnect on every render
  const handleFallbackToPolling = useCallback(() => {
    console.warn('[SocketProvider] Falling back to polling mode');
  }, []);

  const {
    isConnected,
    isReconnecting,
    useFallback,
    socketId,
    joinRoom,
    leaveRoom,
    subscribe,
    emit,
  } = useSocket({
    autoConnect: true,
    onFallbackToPolling: handleFallbackToPolling,
  });

  // Join user room when connected and authenticated
  useEffect(() => {
    if (isConnected && userId) {
      joinRoom('user:join', { userId });
      console.log(`[SocketProvider] Joined user room: ${userId}`);
    }
  }, [isConnected, userId, joinRoom]);

  // Subscribe to notifications
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe('notification:new', (data: unknown) => {
      const notification = data as {
        type: string;
        title: string;
        message: string;
        timestamp: number;
        data?: Record<string, unknown>;
      };

      // Map incoming type string to NotificationType enum
      const typeMap: Record<string, NotificationType> = {
        order_created: NotificationType.ORDER_CREATED,
        order_accepted: NotificationType.ORDER_ACCEPTED,
        order_shipped: NotificationType.ORDER_SHIPPED,
        order_delivered: NotificationType.ORDER_DELIVERED,
        payment_received: NotificationType.PAYMENT_RECEIVED,
        message_received: NotificationType.MESSAGE_RECEIVED,
        review_received: NotificationType.REVIEW_RECEIVED,
        courier_assigned: NotificationType.COURIER_ASSIGNED,
        system: NotificationType.SYSTEM,
      };

      dispatch(
        addNotification({
          type: typeMap[notification.type] || NotificationType.SYSTEM,
          title: notification.title,
          message: notification.message,
        }),
      );
    });

    return unsubscribe;
  }, [isConnected, subscribe, dispatch]);

  const value = useMemo<SocketContextValue>(
    () => ({
      isConnected,
      isReconnecting,
      useFallback,
      socketId,
      joinRoom,
      leaveRoom,
      subscribe,
      emit,
    }),
    [isConnected, isReconnecting, useFallback, socketId, joinRoom, leaveRoom, subscribe, emit],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/**
 * Hook to access socket context.
 */
export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}

export default SocketProvider;
