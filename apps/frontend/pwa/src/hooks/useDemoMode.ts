import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';

export interface Location {
  lat: number;
  lng: number;
}

// Demo account emails
const DEMO_ACCOUNTS = [
  'maria_vendedora@puente.com',
  'carlos_cliente@puente.com',
  'luis_repartidor@puente.com',
  'admin@puente.com',
];

interface UseDemoModeOptions {
  enabled: boolean;
  origin?: Location;
  destination?: Location;
  speedMs?: number; // Time between updates in ms
}

interface UseDemoModeReturn {
  isDemoMode: boolean;
  isDemoAccount: boolean;
  simulatedLocation: Location | null;
  progress: number; // 0-100
  startDemo: () => void;
  stopDemo: () => void;
  resetDemo: () => void;
}

/**
 * Hook for demo mode that simulates courier movement along a path.
 * Only available for demo accounts.
 */
export function useDemoMode({
  enabled,
  origin,
  destination,
  speedMs = 2000,
}: UseDemoModeOptions): UseDemoModeReturn {
  const user = useSelector(selectCurrentUser);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simulatedLocation, setSimulatedLocation] = useState<Location | null>(null);

  // Check if current user is a demo account
  const isDemoAccount = user?.email ? DEMO_ACCOUNTS.includes(user.email) : false;

  // Demo mode is only active if enabled AND user is demo account
  const isDemoMode = enabled && isDemoAccount;

  // Calculate interpolated position between origin and destination
  const interpolatePosition = useCallback(
    (t: number): Location | null => {
      if (!origin || !destination) return null;

      // Clamp t between 0 and 1
      const clampedT = Math.max(0, Math.min(1, t));

      // Add some "wobble" to simulate realistic movement
      const wobble = Math.sin(t * Math.PI * 4) * 0.0002;

      return {
        lat: origin.lat + (destination.lat - origin.lat) * clampedT + wobble,
        lng: origin.lng + (destination.lng - origin.lng) * clampedT + wobble,
      };
    },
    [origin, destination],
  );

  // Start the demo simulation
  const startDemo = useCallback(() => {
    if (!isDemoMode || !origin || !destination) return;
    setIsRunning(true);
    setProgress(0);
    setSimulatedLocation(origin);
  }, [isDemoMode, origin, destination]);

  // Stop the demo
  const stopDemo = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Reset demo to beginning
  const resetDemo = useCallback(() => {
    setIsRunning(false);
    setProgress(0);
    if (origin) {
      setSimulatedLocation(origin);
    }
  }, [origin]);

  // Auto-start demo when enabled and we have coordinates
  useEffect(() => {
    if (isDemoMode && origin && destination && !isRunning) {
      startDemo();
    }
  }, [isDemoMode, origin, destination, isRunning, startDemo]);

  // Animation loop
  useEffect(() => {
    if (!isRunning || !isDemoMode) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2; // 2% per tick = 50 ticks to complete

        if (next >= 100) {
          // Loop back after a delay
          setTimeout(() => {
            setProgress(0);
          }, 3000);
          return 100;
        }

        return next;
      });
    }, speedMs);

    return () => clearInterval(interval);
  }, [isRunning, isDemoMode, speedMs]);

  // Update simulated location when progress changes
  useEffect(() => {
    if (!isDemoMode) return;

    const location = interpolatePosition(progress / 100);
    if (location) {
      setSimulatedLocation(location);
    }
  }, [progress, isDemoMode, interpolatePosition]);

  return {
    isDemoMode,
    isDemoAccount,
    simulatedLocation,
    progress,
    startDemo,
    stopDemo,
    resetDemo,
  };
}

export default useDemoMode;
