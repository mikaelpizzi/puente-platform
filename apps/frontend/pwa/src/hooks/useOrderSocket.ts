import { useEffect } from 'react';
import { useSocketContext } from '../providers/SocketProvider';

interface UseOrderSocketOptions {
  orderId: string;
  onStatusChange?: (status: string, data?: Record<string, unknown>) => void;
  onNewMessage?: (message: { senderId: string; content: string; messageId: string }) => void;
  onLocationUpdate?: (location: { courierId: string; lat: number; lng: number }) => void;
}

/**
 * Hook to subscribe to order-specific events.
 * Automatically joins/leaves order room on mount/unmount.
 */
export function useOrderSocket({
  orderId,
  onStatusChange,
  onNewMessage,
  onLocationUpdate,
}: UseOrderSocketOptions) {
  const { isConnected, joinRoom, leaveRoom, subscribe } = useSocketContext();

  // Join order room when connected
  useEffect(() => {
    if (!isConnected || !orderId) return;

    joinRoom('order:join', { orderId });

    return () => {
      leaveRoom('order:leave', { orderId });
    };
  }, [isConnected, orderId, joinRoom, leaveRoom]);

  // Subscribe to order status changes
  useEffect(() => {
    if (!isConnected || !onStatusChange) return;

    return subscribe('order:status', (data: unknown) => {
      const event = data as { orderId: string; status: string; timestamp: number };
      if (event.orderId === orderId) {
        onStatusChange(event.status, data as Record<string, unknown>);
      }
    });
  }, [isConnected, orderId, subscribe, onStatusChange]);

  // Subscribe to new messages
  useEffect(() => {
    if (!isConnected || !onNewMessage) return;

    return subscribe('message:new', (data: unknown) => {
      const event = data as {
        orderId: string;
        senderId: string;
        content: string;
        messageId: string;
      };
      if (event.orderId === orderId) {
        onNewMessage({
          senderId: event.senderId,
          content: event.content,
          messageId: event.messageId,
        });
      }
    });
  }, [isConnected, orderId, subscribe, onNewMessage]);

  // Subscribe to location updates
  useEffect(() => {
    if (!isConnected || !onLocationUpdate) return;

    return subscribe('location:updated', (data: unknown) => {
      const event = data as {
        orderId?: string;
        courierId: string;
        lat: number;
        lng: number;
      };
      if (!event.orderId || event.orderId === orderId) {
        onLocationUpdate({
          courierId: event.courierId,
          lat: event.lat,
          lng: event.lng,
        });
      }
    });
  }, [isConnected, orderId, subscribe, onLocationUpdate]);

  return { isConnected };
}

export default useOrderSocket;
