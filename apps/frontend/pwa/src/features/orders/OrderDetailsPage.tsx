import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Truck,
  Loader2,
  Send,
  Star,
  X,
} from 'lucide-react';
import { useGetOrderQuery, useDispatchOrderMutation } from './ordersApi';
import { selectCurrentUser } from '../auth/authSlice';
import toast from 'react-hot-toast';
import { useOrderSocket } from '../../hooks/useOrderSocket';
import { DeliveryMap } from '../logistics/DeliveryMap';
import { ReviewForm, ReviewFormData } from '../reviews/ReviewForm';
import { useCreateReviewMutation } from '../reviews/reviewsApi';
import { useTranslation } from 'react-i18next';

export const OrderDetailsPage: React.FC = () => {
  const { t } = useTranslation();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const { data: order, isLoading, error } = useGetOrderQuery(orderId || '', { skip: !orderId });
  const [dispatchOrder, { isLoading: isDispatching }] = useDispatchOrderMutation();
  const [createReview] = useCreateReviewMutation();

  const isSeller = user?.role === 'SELLER' || user?.role === 'ADMIN';
  const isBuyer = user?.role === 'BUYER';
  const canDispatch = isSeller && order?.status === 'pending';
  const canReview = isBuyer && order?.status === 'delivered';

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Real-time courier location tracking
  const [courierLocation, setCourierLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useOrderSocket({
    orderId: orderId || '',
    onLocationUpdate: (location) => {
      setCourierLocation({ lat: location.lat, lng: location.lng });
      setIsSimulating(false); // Got real data, stop simulation
    },
  });

  // Simulation mode: if no real location after 3s on shipped orders, simulate courier movement
  useEffect(() => {
    if (order?.status !== 'shipped' || courierLocation) return;

    const timer = setTimeout(() => {
      // No real data received, start simulation for demo
      setIsSimulating(true);
      // Start at Mexico City center
      let lat = 19.4326;
      let lng = -99.1332;

      setCourierLocation({ lat, lng });

      // Simulate movement every 2 seconds
      const interval = setInterval(() => {
        lat += (Math.random() - 0.5) * 0.002;
        lng += (Math.random() - 0.5) * 0.002;
        setCourierLocation({ lat, lng });
      }, 2000);

      return () => clearInterval(interval);
    }, 3000);

    return () => clearTimeout(timer);
  }, [order?.status, courierLocation]);

  const handleDispatch = async () => {
    if (!orderId) return;
    try {
      await dispatchOrder(orderId).unwrap();
      toast.success('¡Pedido enviado al repartidor!');
    } catch (err: any) {
      toast.error(err.data?.message || 'Error al enviar el pedido');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'processing':
        return <Package className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`orders.status.${status}`, status);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('orderDetails.notFound')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('orderDetails.notFoundMessage')}</p>
        <button
          onClick={() => navigate('/orders')}
          className="px-6 py-2 bg-emerald-500 text-white rounded-lg"
        >
          {t('orderDetails.backToOrders')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('orders.orderNumber', { number: order._id.slice(-8).toUpperCase() })}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            {t('orderDetails.orderStatus')}
          </h3>
          <div className="flex items-center justify-between">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(order.status)}`}
            >
              {getStatusIcon(order.status)}
              <span className="font-medium">{getStatusLabel(order.status)}</span>
            </div>
            {canDispatch && (
              <button
                onClick={handleDispatch}
                disabled={isDispatching}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {isDispatching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {t('orderDetails.sendToCourier')}
              </button>
            )}
          </div>
        </div>

        {/* Real-time Courier Tracking Map */}
        {order.status === 'shipped' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-500" />
                {t('orderDetails.courierLocation')}
              </h3>
              {courierLocation && (
                <span
                  className={`flex items-center gap-1 text-xs ${isSimulating ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full animate-pulse ${isSimulating ? 'bg-orange-500' : 'bg-green-500'}`}
                  />
                  {isSimulating ? 'DEMO' : t('orderDetails.live')}
                </span>
              )}
            </div>
            <div className="h-64">
              <DeliveryMap courierLocation={courierLocation || undefined} />
            </div>
            {!courierLocation && (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {t('orderDetails.waitingCourier')}
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            {t('orderDetails.products')}
          </h3>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('orderDetails.quantity')}: {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 flex justify-between items-center">
            <span className="font-medium text-gray-900 dark:text-white">{t('orders.total')}</span>
            <span className="text-xl font-bold text-emerald-600">${order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              {t('checkout.shippingAddress')}
            </h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
              <div>
                <p className="text-gray-900 dark:text-white">{order.shippingAddress.street}</p>
                <p className="text-gray-600 dark:text-gray-300">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
                {order.shippingAddress.zipCode && (
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('orderDetails.zipCode')}: {order.shippingAddress.zipCode}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Order Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            {t('orderDetails.orderInfo')}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('orderDetails.orderId')}</span>
              <span className="text-gray-900 dark:text-white font-mono">{order._id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('orderDetails.sellerId')}</span>
              <span className="text-gray-900 dark:text-white font-mono">
                {order.sellerId.slice(-8)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('orderDetails.buyerId')}</span>
              <span className="text-gray-900 dark:text-white font-mono">
                {order.buyerId.slice(-8)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('orders.date')}</span>
              <span className="text-gray-900 dark:text-white">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t('orderDetails.notes')}
            </h3>
            <p className="text-gray-900 dark:text-white">{order.notes}</p>
          </div>
        )}

        {/* Proof of Delivery */}
        {order.status === 'delivered' && order.proofOfDelivery && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              {t('orderDetails.proofOfDelivery')}
            </h3>
            <div className="space-y-4">
              {order.proofOfDelivery.photoUrl && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Foto</p>
                  <img
                    src={order.proofOfDelivery.photoUrl}
                    alt="Prueba de entrega"
                    className="w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
              {order.proofOfDelivery.signatureUrl && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Firma</p>
                  <img
                    src={order.proofOfDelivery.signatureUrl}
                    alt="Firma del cliente"
                    className="max-w-xs bg-white rounded-lg border border-gray-200 dark:border-gray-700 p-2"
                  />
                </div>
              )}
              {order.proofOfDelivery.notes && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Notas del repartidor
                  </p>
                  <p className="text-gray-900 dark:text-white text-sm">
                    {order.proofOfDelivery.notes}
                  </p>
                </div>
              )}
              {order.deliveredAt && (
                <p className="text-xs text-gray-400">
                  Entregado: {new Date(order.deliveredAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Leave Review - Only for BUYER on delivered orders */}
        {canReview && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  ¿Cómo fue tu experiencia?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Deja una reseña al vendedor
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
              >
                <Star className="w-4 h-4" />
                Dejar reseña
              </button>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && order && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-lg w-full">
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg z-10"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <ReviewForm
                orderId={order._id}
                targetId={order.sellerId}
                targetType="seller"
                onSubmit={async (data: ReviewFormData) => {
                  try {
                    await createReview(data).unwrap();
                    toast.success('¡Gracias por tu reseña!');
                    setShowReviewModal(false);
                  } catch (err: any) {
                    console.error('Review submission error:', err);
                    const errorMessage = err?.data?.message || 'Error al enviar la reseña';
                    toast.error(errorMessage);
                  }
                }}
                onCancel={() => setShowReviewModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
