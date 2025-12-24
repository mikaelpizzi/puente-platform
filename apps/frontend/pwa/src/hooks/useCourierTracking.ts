import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

export interface CourierLocation {
  lat: number;
  lng: number;
  timestamp?: number;
}

interface UseCourierTrackingOptions {
  orderId?: string;
  courierId?: string;
  initialLocation?: CourierLocation;
}

interface UseCourierTrackingReturn {
  courierLocation: CourierLocation | null;
  isConnected: boolean;
  isLive: boolean;
  lastUpdate: number | null;
}

/**
 * Hook for real-time courier location tracking via WebSocket.
 *
 * Joins order room and listens for location updates.
 * Falls back to initial location if WebSocket is not available.
 */
export function useCourierTracking({
  orderId,
  courierId,
  initialLocation,
}: UseCourierTrackingOptions): UseCourierTrackingReturn {
  const { isConnected, joinRoom, leaveRoom, subscribe } = useSocket();
  const [courierLocation, setCourierLocation] = useState<CourierLocation | null>(
    initialLocation || null,
  );
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  // Join order room for location updates
  useEffect(() => {
    if (!orderId || !isConnected) return;

    // Join the order room to receive courier location updates
    joinRoom('order:join', { orderId });

    // Cleanup: leave room on unmount
    return () => {
      leaveRoom('order:leave', { orderId });
    };
  }, [orderId, isConnected, joinRoom, leaveRoom]);

  // Also join courier-specific room if we have courierId
  useEffect(() => {
    if (!courierId || !isConnected) return;

    joinRoom('courier:join', { courierId });

    return () => {
      leaveRoom('courier:leave', { courierId });
    };
  }, [courierId, isConnected, joinRoom, leaveRoom]);

  // Listen for location updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe('location:updated', (data: unknown) => {
      const locationData = data as {
        lat: number;
        lng: number;
        courierId?: string;
        orderId?: string;
        timestamp?: number;
      };

      // Update location if this update is for our order/courier
      if (
        (orderId && locationData.orderId === orderId) ||
        (courierId && locationData.courierId === courierId) ||
        (!orderId && !courierId) // Accept any update if no filter
      ) {
        setCourierLocation({
          lat: locationData.lat,
          lng: locationData.lng,
          timestamp: locationData.timestamp || Date.now(),
        });
        setIsLive(true);
        setLastUpdate(Date.now());
      }
    });

    return unsubscribe;
  }, [isConnected, orderId, courierId, subscribe]);

  // Update from initial location if we get new data from API
  useEffect(() => {
    if (initialLocation && !isLive) {
      setCourierLocation(initialLocation);
    }
  }, [initialLocation, isLive]);

  // Mark as not live if no updates for 30 seconds
  useEffect(() => {
    if (!lastUpdate) return;

    const timeout = setTimeout(() => {
      const timeSinceUpdate = Date.now() - lastUpdate;
      if (timeSinceUpdate > 30000) {
        setIsLive(false);
      }
    }, 30000);

    return () => clearTimeout(timeout);
  }, [lastUpdate]);

  return {
    courierLocation,
    isConnected,
    isLive,
    lastUpdate,
  };
}

export default useCourierTracking;
