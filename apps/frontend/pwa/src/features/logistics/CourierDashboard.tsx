import React, { useState, useEffect, useRef } from 'react';
import {
  useGetAvailableJobsQuery,
  useAcceptJobMutation,
  useUpdateLocationMutation,
  Job,
  Location,
} from './logisticsApi';
import { DeliveryMap } from './DeliveryMap';
import { MapPin, Navigation, Package, DollarSign, Bell, BellOff } from 'lucide-react';

// --- Components ---

const LongPressButton: React.FC<{
  onComplete: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
}> = ({ onComplete, label, className, disabled }) => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPressed = useRef(false);

  const startPress = () => {
    if (disabled) return;
    isPressed.current = true;
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intervalRef.current!);
          isPressed.current = false;
          onComplete();
          return 100;
        }
        return prev + 4; // Complete in ~2.5s (100 / 4 * 100ms)
      });
    }, 50); // Update every 50ms
  };

  const endPress = () => {
    isPressed.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(0);
  };

  return (
    <button
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      disabled={disabled}
      className={`relative overflow-hidden select-none active:scale-95 transition-transform ${className}`}
    >
      {/* Progress Background */}
      <div
        className="absolute inset-0 bg-green-600 transition-all duration-75 ease-linear"
        style={{ width: `${progress}%` }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {progress >= 100 ? '¡Confirmado!' : label}
      </span>
    </button>
  );
};

export const CourierDashboard: React.FC = () => {
  // --- State ---
  const [currentLocation, setCurrentLocation] = useState<Location | undefined>(undefined);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'unknown'>('unknown');

  // --- API ---
  const { data: jobs, isLoading } = useGetAvailableJobsQuery();
  const [acceptJob] = useAcceptJobMutation();
  const [updateLocation] = useUpdateLocationMutation();

  // --- Effects ---

  // 1. Geolocation Tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada en este dispositivo');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // GPS Jitter Filter: Ignore low accuracy updates (> 50m)
        if (accuracy > 50) return;

        const newLoc = { lat: latitude, lng: longitude };
        setCurrentLocation(newLoc);

        // Send update to backend (Throttling could be added here)
        updateLocation(newLoc);
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionStatus('denied');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [updateLocation]);

  // 2. New Job Alerts (Hands-Free Mode)
  const prevJobsLength = useRef(0);
  useEffect(() => {
    if (jobs && jobs.length > prevJobsLength.current) {
      // New job arrived!
      if (handsFreeMode) {
        // Vibrate pattern: 500ms on, 200ms off, 500ms on
        if (navigator.vibrate) {
          navigator.vibrate([500, 200, 500]);
        }
        // Play sound (using a generic notification sound URL or Audio API)
        const audio = new Audio('/notification.mp3'); // Placeholder
        audio.play().catch((e) => console.log('Audio play failed (interaction needed)', e));
      }
    }
    prevJobsLength.current = jobs?.length || 0;
  }, [jobs, handsFreeMode]);

  // --- Handlers ---

  const handleAcceptJob = async (jobId: string) => {
    try {
      await acceptJob(jobId).unwrap();
      // In a real app, we'd navigate to a "Active Delivery" screen
      alert('¡Trabajo aceptado! Navegando a recolección...');
      setSelectedJob(null);
    } catch (err) {
      console.error('Failed to accept job', err);
      alert('Error al aceptar el trabajo. Puede que ya no esté disponible.');
    }
  };

  // --- Render ---

  if (permissionStatus === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-gray-50">
        <Navigation className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Ubicación requerida</h2>
        <p className="text-gray-600 mt-2">
          Para recibir pedidos, necesitamos acceder a tu ubicación. Por favor habilita el GPS en la
          configuración de tu navegador.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative bg-gray-100">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4 flex justify-between items-start pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm pointer-events-auto">
          <span
            className={`inline-block w-2 h-2 rounded-full mr-2 ${currentLocation ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
          />
          <span className="text-xs font-bold text-gray-800">
            {currentLocation ? 'En línea' : 'Buscando GPS...'}
          </span>
        </div>

        <button
          onClick={() => setHandsFreeMode(!handsFreeMode)}
          className={`p-2 rounded-full shadow-lg pointer-events-auto transition-colors ${handsFreeMode ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
        >
          {handsFreeMode ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
      </div>

      {/* Map Layer */}
      <div className="flex-1 z-0">
        <DeliveryMap
          courierLocation={currentLocation}
          pickup={selectedJob?.pickupLocation}
          dropoff={selectedJob?.dropoffLocation}
        />
      </div>

      {/* Bottom Sheet / Job List */}
      <div className="z-10 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] max-h-[50vh] overflow-y-auto transition-all">
        <div className="p-4 sticky top-0 bg-white z-20 border-b border-gray-100">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Pedidos Disponibles
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
              {jobs?.length || 0}
            </span>
          </h2>
        </div>

        <div className="p-4 space-y-4 pb-20">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Cargando pedidos...</div>
          ) : jobs?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No hay pedidos cercanos.</p>
              <p className="text-sm">Espera en una zona concurrida.</p>
            </div>
          ) : (
            jobs?.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`border rounded-xl p-4 transition-all ${selectedJob?.id === job.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-lg font-bold text-green-600 flex items-center justify-end">
                      <DollarSign size={16} />
                      {job.earnings}
                    </span>
                    <span className="text-xs text-gray-400">{job.distance} km</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-blue-500" />
                    <span>Recolección</span>
                  </div>
                  <div className="h-px w-8 bg-gray-300" />
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-red-500" />
                    <span>Entrega</span>
                  </div>
                </div>

                {selectedJob?.id === job.id && (
                  <LongPressButton
                    label="Mantén presionado para ACEPTAR"
                    onComplete={() => handleAcceptJob(job.id)}
                    className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold shadow-lg active:bg-gray-800"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
