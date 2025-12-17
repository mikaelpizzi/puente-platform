import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSocketContext } from '../providers/SocketProvider';
import {
  Truck,
  MapPin,
  Package,
  CheckCircle,
  Loader2,
  Camera,
  Edit3,
  X,
  Navigation,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useGetAvailableJobsQuery, useAcceptJobMutation } from '../features/logistics/logisticsApi';
import { useGetOrdersAsCourierQuery } from '../features/orders/ordersApi';
import toast from 'react-hot-toast';

interface PODModalProps {
  orderId: string;
  onClose: () => void;
  onComplete: (data: { photoBase64?: string; signatureBase64?: string; notes?: string }) => void;
  isLoading: boolean;
}

const PODModal: React.FC<PODModalProps> = ({ orderId, onClose, onComplete, isLoading }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'photo' | 'signature'>('photo');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDrawing = useRef(false);

  // Compress image to reduce payload size
  const compressImage = (base64: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = base64;
    });
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setPhoto(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get scaled coordinates for canvas
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      // Compress signature too
      setSignature(canvas.toDataURL('image/png', 0.8));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const handleSubmit = async () => {
    if (!photo && !signature) {
      toast.error('Debes proporcionar una foto o firma');
      return;
    }
    onComplete({
      photoBase64: photo || undefined,
      signatureBase64: signature || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Prueba de Entrega</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Pedido #{orderId.slice(-8).toUpperCase()}
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('photo')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
                activeTab === 'photo'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Camera className="w-4 h-4" /> Foto
            </button>
            <button
              onClick={() => setActiveTab('signature')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
                activeTab === 'signature'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Edit3 className="w-4 h-4" /> Firma
            </button>
          </div>

          {/* Photo Tab */}
          {activeTab === 'photo' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
              {photo ? (
                <div className="relative">
                  <img src={photo} alt="POD" className="w-full rounded-lg" />
                  <button
                    onClick={() => setPhoto(null)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-emerald-500 transition-colors"
                >
                  <Camera className="w-12 h-12 mb-2" />
                  <span>Tomar foto</span>
                </button>
              )}
            </div>
          )}

          {/* Signature Tab */}
          {activeTab === 'signature' && (
            <div className="space-y-4">
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={350}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full touch-none cursor-crosshair"
                />
              </div>
              <button onClick={clearSignature} className="text-sm text-red-500 hover:underline">
                Limpiar firma
              </button>
            </div>
          )}

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Dejado con el portero"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
            />
          </div>

          {/* Status */}
          <div className="mt-4 flex gap-2 text-sm">
            <span className={`${photo ? 'text-emerald-500' : 'text-gray-400'}`}>
              {photo ? '✓' : '○'} Foto
            </span>
            <span className={`${signature ? 'text-emerald-500' : 'text-gray-400'}`}>
              {signature ? '✓' : '○'} Firma
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || (!photo && !signature)}
            className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            Confirmar Entrega
          </button>
        </div>
      </div>
    </div>
  );
};

export const LogisticsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isCourier = user?.role === 'COURIER';

  const {
    data: availableJobs,
    isLoading: isLoadingJobs,
    refetch: refetchJobs,
  } = useGetAvailableJobsQuery(undefined, {
    skip: !isCourier,
    pollingInterval: 30000,
  });

  const {
    data: myDeliveries,
    isLoading: isLoadingDeliveries,
    refetch: refetchDeliveries,
  } = useGetOrdersAsCourierQuery(undefined, {
    skip: !isCourier,
    pollingInterval: 30000,
  });

  const [acceptJob, { isLoading: isAccepting }] = useAcceptJobMutation();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [podModalOrderId, setPodModalOrderId] = useState<string | null>(null);
  const [isCompletingDelivery, setIsCompletingDelivery] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'history'>('jobs');

  const activeDeliveries = myDeliveries?.filter((o) => o.status === 'shipped') || [];
  const completedDeliveries = myDeliveries?.filter((o) => o.status === 'delivered') || [];

  // Socket context for real-time location broadcast
  const { emit, isConnected } = useSocketContext();

  // Broadcast courier location when has active deliveries
  useEffect(() => {
    if (!isCourier || activeDeliveries.length === 0 || !isConnected) return;

    let watchId: number | null = null;

    const startTracking = () => {
      if (!navigator.geolocation) {
        console.error('Geolocation not supported');
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Emit location update to socket server
          emit('updateLocation', {
            driverId: user?.id,
            lat: latitude,
            lng: longitude,
          });
        },
        (error) => {
          console.error('GPS error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
    };

    startTracking();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isCourier, activeDeliveries.length, isConnected, emit, user?.id]);

  const handleAcceptJob = async (orderId: string) => {
    try {
      await acceptJob(orderId).unwrap();
      toast.success('¡Trabajo aceptado!');
      refetchJobs();
      refetchDeliveries();
    } catch (error: any) {
      toast.error(error.data?.message || 'Error al aceptar el trabajo');
    }
  };

  const handleCompleteDelivery = async (data: {
    photoBase64?: string;
    signatureBase64?: string;
    notes?: string;
  }) => {
    if (!podModalOrderId) return;
    setIsCompletingDelivery(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/orders/${podModalOrderId}/complete-delivery`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error');
      }
      toast.success('¡Entrega completada!');
      setPodModalOrderId(null);
      refetchDeliveries();
    } catch (error: any) {
      toast.error(error.message || 'Error al completar la entrega');
    } finally {
      setIsCompletingDelivery(false);
    }
  };

  const openInMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  if (isLoadingJobs || isLoadingDeliveries) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">{t('logistics.loadingDeliveries')}</p>
      </div>
    );
  }

  if (!isCourier) {
    return (
      <div className="p-4 pb-24">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Truck className="text-emerald-500" />
          {t('nav.shipping')}
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('logistics.courierOnly')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* POD Modal */}
      {podModalOrderId && (
        <PODModal
          orderId={podModalOrderId}
          onClose={() => setPodModalOrderId(null)}
          onComplete={handleCompleteDelivery}
          isLoading={isCompletingDelivery}
        />
      )}

      {/* My Active Deliveries */}
      {activeDeliveries.length > 0 && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Package className="text-emerald-500" />
            {t('logistics.activeDeliveries')} ({activeDeliveries.length})
          </h2>
          <div className="space-y-3">
            {activeDeliveries.map((order) => (
              <div
                key={order._id}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-2 border-emerald-500"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    {t('logistics.enRoute')}
                  </span>
                  <span className="font-bold text-emerald-600">${order.total.toFixed(2)}</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Pedido #{order._id.slice(-8).toUpperCase()}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </p>
                {order.shippingAddress && (
                  <button
                    onClick={() =>
                      openInMaps(`${order.shippingAddress?.street}, ${order.shippingAddress?.city}`)
                    }
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3"
                  >
                    <Navigation size={14} />
                    {order.shippingAddress.street}, {order.shippingAddress.city}
                  </button>
                )}
                <button
                  onClick={() => setPodModalOrderId(order._id)}
                  className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Completar Entrega
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Jobs */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Truck className="text-emerald-500" />
            Trabajos Disponibles
          </h2>
          <button
            onClick={() => {
              refetchJobs();
              refetchDeliveries();
            }}
            className="text-sm text-emerald-600 hover:underline"
          >
            Actualizar
          </button>
        </div>

        {!availableJobs || availableJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay trabajos disponibles
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Los nuevos trabajos aparecerán aquí automáticamente
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {availableJobs.map((order) => (
              <div
                key={order._id}
                onClick={() => setSelectedOrderId(order._id)}
                className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-2 transition-all cursor-pointer ${
                  selectedOrderId === order._id
                    ? 'border-emerald-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    DISPONIBLE
                  </span>
                  <span className="font-bold text-emerald-600">${order.total.toFixed(2)}</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Pedido #{order._id.slice(-8).toUpperCase()}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </p>
                {order.shippingAddress && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <MapPin size={14} className="text-emerald-500" />
                    <span>
                      {order.shippingAddress.street}, {order.shippingAddress.city}
                    </span>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcceptJob(order._id);
                  }}
                  disabled={isAccepting}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  {isAccepting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Aceptar Trabajo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery History */}
      {completedDeliveries.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" />
              <span className="font-bold text-gray-800 dark:text-white">
                Historial de Entregas ({completedDeliveries.length})
              </span>
            </div>
            {showHistory ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {showHistory && (
            <div className="mt-3 space-y-3">
              {completedDeliveries.map((order) => (
                <div
                  key={order._id}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-emerald-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      ENTREGADO
                    </span>
                    <span className="font-bold text-gray-600 dark:text-gray-400">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">
                    Pedido #{order._id.slice(-8).toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                  {order.shippingAddress && (
                    <p className="text-xs text-gray-400 mt-1">
                      {order.shippingAddress.street}, {order.shippingAddress.city}
                    </p>
                  )}
                  <p className="text-xs text-emerald-600 mt-2">Ver detalles →</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
