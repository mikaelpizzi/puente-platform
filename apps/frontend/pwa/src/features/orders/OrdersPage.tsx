import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
  MapPin,
  Star,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../auth/authSlice';
import {
  useGetOrdersAsBuyerQuery,
  useGetOrdersAsSellerQuery,
  Order,
  OrderStatus,
} from './ordersApi';

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const userRole = user?.role;

  // Determine which tabs to show based on role
  const canSeeBuyer = userRole === 'BUYER' || userRole === 'ADMIN';
  const canSeeSeller = userRole === 'SELLER' || userRole === 'ADMIN';

  // Set default tab based on role
  const getDefaultTab = (): 'buyer' | 'seller' => {
    if (userRole === 'SELLER') return 'seller';
    if (userRole === 'BUYER') return 'buyer';
    return 'buyer'; // ADMIN defaults to buyer
  };

  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>(getDefaultTab());
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  // Update tab when role changes
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [userRole]);

  // Fetch orders based on active tab
  const statusFilter = filterStatus === 'all' ? undefined : filterStatus;
  const {
    data: buyerOrders = [],
    isLoading: buyerLoading,
    error: buyerError,
  } = useGetOrdersAsBuyerQuery(statusFilter, { skip: activeTab !== 'buyer' || !canSeeBuyer });

  const {
    data: sellerOrders = [],
    isLoading: sellerLoading,
    error: sellerError,
  } = useGetOrdersAsSellerQuery(statusFilter, { skip: activeTab !== 'seller' || !canSeeSeller });

  const orders = activeTab === 'buyer' ? buyerOrders : sellerOrders;
  const isLoading = activeTab === 'buyer' ? buyerLoading : sellerLoading;
  const error = activeTab === 'buyer' ? buyerError : sellerError;

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
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <Package className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`orders.${status}`, { defaultValue: status });
  };

  // Show both tabs only for ADMIN, otherwise show only the relevant one
  const showBothTabs = userRole === 'ADMIN';

  return (
    <div className="pb-24 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow p-4 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          {userRole === 'SELLER'
            ? t('nav.mySales')
            : userRole === 'BUYER'
              ? t('nav.myOrders')
              : t('orders.title')}
        </h2>

        {/* Role Tabs - Only show if ADMIN or if we want to show tabs */}
        {showBothTabs && (
          <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
            <button
              onClick={() => setActiveTab('buyer')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'buyer'
                  ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {t('nav.myOrders')}
            </button>
            <button
              onClick={() => setActiveTab('seller')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'seller'
                  ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {t('nav.mySales')}
            </button>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filterStatus === status
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? t('orders.all') : getStatusLabel(status)}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 dark:text-red-400">{t('errors.generic')}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && orders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {userRole === 'SELLER' ? 'No tienes ventas aún' : 'No tienes compras aún'}
            </p>
          </div>
        )}

        {/* Orders List */}
        {orders.map((order: Order) => (
          <div
            key={order._id}
            onClick={() => navigate(`/orders/${order._id}`)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 dark:text-white">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      • {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {activeTab === 'buyer' || userRole === 'BUYER'
                      ? `Vendedor: ${order.sellerId.slice(-6)}`
                      : `Cliente: ${order.buyerId.slice(-6)}`}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    order.status,
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  {getStatusLabel(order.status)}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-2 flex justify-between items-center gap-2">
              {/* Tracking button - only for orders being delivered */}
              {(order.status === 'shipped' || order.status === 'processing') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/orders/${order._id}`);
                  }}
                  className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  <MapPin className="w-3 h-3" />
                  Ver Tracking
                </button>
              )}
              {/* Review button for delivered orders (buyers only) */}
              {order.status === 'delivered' && userRole === 'BUYER' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/orders/${order._id}`);
                  }}
                  className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                >
                  <Star className="w-3 h-3" />
                  Dejar reseña
                </button>
              )}
              <div className="flex-1" />
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition-colors">
                <span>Ver detalles</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
