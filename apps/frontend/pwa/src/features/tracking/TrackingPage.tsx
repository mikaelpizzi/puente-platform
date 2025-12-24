import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useGetPublicDeliveryQuery } from '../logistics/logisticsApi';
import { DeliveryMap } from '../logistics/DeliveryMap';
import { useCourierTracking } from '../../hooks/useCourierTracking';
import { useDemoMode } from '../../hooks/useDemoMode';
import {
  Loader2,
  MapPin,
  Phone,
  Check,
  Package,
  Truck,
  Home,
  Wifi,
  WifiOff,
  Play,
  RotateCcw,
} from 'lucide-react';

const DeliveryStatusSteps = ({ status, eta }: { status: string; eta: string }) => {
  const steps = [
    { id: 'preparing', label: 'Preparando', icon: Package },
    { id: 'picked_up', label: 'Recolectado', icon: Check },
    { id: 'in_transit', label: 'En Camino', icon: Truck },
    { id: 'delivered', label: 'Entregado', icon: Home },
  ];

  const currentIndex = steps.findIndex((s) => s.id === status);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800 dark:text-white text-lg">
          {status === 'delivered' ? '¡Pedido Entregado!' : `Llega en ~${eta}`}
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full uppercase">
          {status.replace('_', ' ')}
        </span>
      </div>

      <div className="relative flex justify-between">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-green-500 -z-0 transition-all duration-500"
          style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isActive = index <= activeIndex;
          const isCurrent = index === activeIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isActive
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-green-100 dark:ring-green-900/30 scale-110' : ''}`}
              >
                <Icon size={14} />
              </div>
              <span
                className={`text-xs mt-2 font-medium ${isActive ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DriverInfoCard = ({
  driver,
  isLive,
  isDemoMode,
}: {
  driver: { name: string };
  isLive: boolean;
  isDemoMode: boolean;
}) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-4 animate-fade-in-up">
    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-xl border-2 border-white shadow-sm">
      🛵
    </div>
    <div className="flex-1">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
        Tu Repartidor {isDemoMode && <span className="text-purple-500">(Demo)</span>}
      </p>
      <p className="font-bold text-gray-900 dark:text-white text-lg">{driver.name}</p>
    </div>
    <div className="flex gap-2 items-center">
      {isLive || isDemoMode ? (
        <div
          className={`flex items-center gap-1 ${isDemoMode ? 'text-purple-500' : 'text-green-600 dark:text-green-400'}`}
        >
          <Wifi size={16} />
          <span className="text-xs font-medium">{isDemoMode ? 'Demo' : 'En vivo'}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-gray-400">
          <WifiOff size={16} />
        </div>
      )}
      <button className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
        <Phone size={20} />
      </button>
    </div>
  </div>
);

// Demo mode banner component
const DemoBanner = ({ progress, onReset }: { progress: number; onReset: () => void }) => (
  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 rounded-xl mb-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
        <Play size={16} className="ml-0.5" />
      </div>
      <div>
        <p className="font-bold text-sm">🎬 Modo Demo Activo</p>
        <p className="text-xs text-white/80">Simulando entrega en tiempo real</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {/* Progress bar */}
      <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs font-mono">{progress}%</span>
      <button
        onClick={onReset}
        className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
        title="Reiniciar demo"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  </div>
);

export const TrackingPage: React.FC = () => {
  const { trackingId } = useParams<{ trackingId: string }>();
  const [searchParams] = useSearchParams();
  const demoParam = searchParams.get('demo') === 'true';

  // Polling every 30s as fallback
  const {
    data: delivery,
    isLoading,
    error,
  } = useGetPublicDeliveryQuery(trackingId || '', {
    skip: !trackingId,
    pollingInterval: 30000,
  });

  // Real-time courier tracking via WebSocket
  const { courierLocation, isConnected, isLive } = useCourierTracking({
    orderId: trackingId,
    courierId: delivery?.courier?.name,
    initialLocation: delivery?.courier?.location,
  });

  // Demo mode simulation
  const { isDemoMode, isDemoAccount, simulatedLocation, progress, resetDemo } = useDemoMode({
    enabled: demoParam,
    origin: delivery?.origin,
    destination: delivery?.destination,
    speedMs: 1500, // Update every 1.5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">Localizando tu pedido...</p>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <MapPin className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Pedido no encontrado
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xs mx-auto">
          El enlace podría haber expirado o el código es incorrecto. Verifica la URL.
        </p>
        <a
          href="#"
          className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-transform active:scale-95"
        >
          <Phone size={18} /> Contactar Soporte
        </a>
      </div>
    );
  }

  // Priority: Demo location > WebSocket location > API location
  const currentCourierLocation = isDemoMode
    ? simulatedLocation
    : courierLocation || delivery.courier?.location;

  // Show demo banner hint if user is demo account but demo mode is not active
  const showDemoHint = isDemoAccount && !isDemoMode && delivery.status === 'in_transit';

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4 pb-20">
      {/* Demo mode banner */}
      {isDemoMode && <DemoBanner progress={progress} onReset={resetDemo} />}

      {/* Demo hint for demo accounts */}
      {showDemoHint && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-3 rounded-xl">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            💡 <strong>Cuenta Demo:</strong> Agrega{' '}
            <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded">?demo=true</code> a la
            URL para simular el tracking en vivo.
          </p>
        </div>
      )}

      <DeliveryStatusSteps status={delivery.status} eta={delivery.eta} />

      {/* Map Container */}
      <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700 relative z-0">
        <DeliveryMap
          pickup={delivery.origin}
          dropoff={delivery.destination}
          courierLocation={currentCourierLocation ?? undefined}
          className="h-full w-full"
        />

        {/* Live/Demo badge overlay */}
        {delivery.status === 'in_transit' && (
          <div
            className={`absolute top-4 right-4 backdrop-blur px-3 py-1 rounded-full shadow-sm z-[400] flex items-center gap-2 ${
              isDemoMode
                ? 'bg-purple-500/90 text-white'
                : isLive
                  ? 'bg-red-500/90 text-white'
                  : 'bg-white/90 text-gray-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDemoMode || isLive ? 'bg-white animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-xs font-bold">
              {isDemoMode ? '🎬 DEMO' : isLive ? 'EN VIVO' : 'Actualizando...'}
            </span>
          </div>
        )}

        {/* Connection status indicator */}
        {!isConnected && !isDemoMode && delivery.status === 'in_transit' && (
          <div className="absolute bottom-4 left-4 bg-amber-100 text-amber-800 px-3 py-1 rounded-full shadow-sm z-[400] flex items-center gap-2">
            <WifiOff size={14} />
            <span className="text-xs font-medium">Sin conexión en vivo</span>
          </div>
        )}
      </div>

      {delivery.courier && (
        <DriverInfoCard driver={delivery.courier} isLive={isLive} isDemoMode={isDemoMode} />
      )}

      {delivery.status === 'delivered' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-4 rounded-xl text-center animate-in fade-in slide-in-from-bottom-4">
          <p className="text-green-800 dark:text-green-300 font-bold">¡Gracias por tu compra!</p>
          <p className="text-green-600 dark:text-green-400 text-sm mt-1">
            Esperamos que disfrutes tu pedido.
          </p>
        </div>
      )}
    </div>
  );
};
