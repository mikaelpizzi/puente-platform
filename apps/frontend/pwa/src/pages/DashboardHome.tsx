import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Package,
  ShoppingCart,
  Truck,
  TrendingUp,
  ClipboardList,
  DollarSign,
  MapPin,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';

export const DashboardHome: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const userRole = user?.role;

  // Role-specific quick actions
  const sellerActions = [
    {
      titleKey: 'dashboard.myInventory',
      icon: Package,
      path: '/inventory',
      color: 'bg-blue-500',
      descriptionKey: 'dashboard.manageProductsStock',
    },
    {
      titleKey: 'nav.mySales',
      icon: ClipboardList,
      path: '/orders',
      color: 'bg-purple-500',
      descriptionKey: 'dashboard.viewReceivedOrders',
    },
    {
      titleKey: 'nav.charge',
      icon: ShoppingCart,
      path: '/checkout',
      color: 'bg-emerald-500',
      descriptionKey: 'dashboard.posAndQr',
    },
    {
      titleKey: 'nav.finance',
      icon: DollarSign,
      path: '/finance',
      color: 'bg-yellow-500',
      descriptionKey: 'dashboard.balanceTransactions',
    },
  ];

  const buyerActions = [
    {
      titleKey: 'dashboard.explore',
      icon: ShoppingCart,
      path: '/marketplace',
      color: 'bg-emerald-500',
      descriptionKey: 'dashboard.searchBuyProducts',
    },
    {
      titleKey: 'nav.myOrders',
      icon: ClipboardList,
      path: '/orders',
      color: 'bg-blue-500',
      descriptionKey: 'dashboard.orderHistory',
    },
  ];

  const courierActions = [
    {
      titleKey: 'dashboard.myDeliveries',
      icon: Truck,
      path: '/logistics',
      color: 'bg-emerald-600',
      descriptionKey: 'dashboard.viewAssignedJobs',
    },
    {
      titleKey: 'dashboard.routeMap',
      icon: MapPin,
      path: '/logistics',
      color: 'bg-blue-500',
      descriptionKey: 'dashboard.navigationTracking',
    },
  ];

  // Select actions based on role
  const quickActions =
    userRole === 'SELLER'
      ? sellerActions
      : userRole === 'BUYER'
        ? buyerActions
        : userRole === 'COURIER'
          ? courierActions
          : sellerActions;

  // Role-specific greeting
  const getRoleGreeting = () => {
    switch (userRole) {
      case 'SELLER':
        return t('dashboard.greetingSeller');
      case 'BUYER':
        return t('dashboard.greetingBuyer');
      case 'COURIER':
        return t('dashboard.greetingCourier');
      default:
        return t('dashboard.greetingDefault');
    }
  };

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 mt-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.hello', { name: user?.name || t('common.user') })} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400">{getRoleGreeting()}</p>
      </div>

      {/* KPIs - Only for SELLER */}
      {userRole === 'SELLER' && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                <TrendingUp size={18} />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('dashboard.salesToday')}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">$0.00</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                <Package size={18} />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('dashboard.products')}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
          </div>
        </div>
      )}

      {/* Pending deliveries count for COURIER */}
      {userRole === 'COURIER' && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-2xl mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{t('dashboard.pendingDeliveries')}</p>
              <p className="text-4xl font-bold">0</p>
            </div>
            <Truck size={48} className="opacity-80" />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {userRole === 'COURIER' ? t('dashboard.quickAccess') : t('dashboard.quickActions')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.titleKey}
            onClick={() => navigate(action.path)}
            className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all active:scale-[0.98] text-left group"
          >
            <div
              className={`p-4 rounded-xl ${action.color} text-white mr-4 shadow-lg group-hover:scale-110 transition-transform`}
            >
              <action.icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                {t(action.titleKey)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t(action.descriptionKey)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
