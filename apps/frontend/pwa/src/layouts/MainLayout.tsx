import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Home, Package, Truck, ShoppingCart, ClipboardList, DollarSign } from 'lucide-react';
import { OfflineSyncManager } from '../features/inventory/OfflineSyncManager';
import { ConflictResolver } from '../features/sync/ConflictResolver';
import { logout, selectCurrentUser } from '../features/auth/authSlice';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { NotificationBell } from '../features/notifications/NotificationBell';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
} from '../features/notifications/notificationsSlice';
import type { RootState } from '../app/store';

export const MainLayout: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Notifications state from Redux
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const unreadCount = useSelector((state: RootState) => state.notifications.unreadCount);

  const allNavItems = [
    { to: '/', icon: Home, labelKey: 'nav.home', roles: ['SELLER', 'BUYER'] },
    { to: '/marketplace', icon: ShoppingCart, labelKey: 'nav.buy', roles: ['BUYER'] },
    { to: '/inventory', icon: Package, labelKey: 'nav.inventory', roles: ['SELLER'] },
    { to: '/orders', icon: ClipboardList, labelKey: 'nav.mySales', roles: ['SELLER'] },
    { to: '/orders', icon: ClipboardList, labelKey: 'nav.myOrders', roles: ['BUYER'] },
    { to: '/checkout', icon: ShoppingCart, labelKey: 'nav.charge', roles: ['SELLER'] },
    { to: '/finance', icon: DollarSign, labelKey: 'nav.finance', roles: ['SELLER'] },
    { to: '/logistics', icon: Truck, labelKey: 'nav.shipping', roles: ['SELLER', 'COURIER'] },
  ];

  const navItems = allNavItems.filter((item) => user?.role && item.roles.includes(user.role));

  const handleLogout = () => {
    dispatch(logout());
    setIsLogoutModalOpen(false);
    navigate('/login');
  };

  const isDarkMode = document.documentElement.classList.contains('dark');

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <OfflineSyncManager />
      <ConflictResolver />

      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-20 flex justify-between items-center transition-colors duration-200">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Puente</h1>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={(id) => dispatch(markAsRead(id))}
            onMarkAllAsRead={() => dispatch(markAllAsRead())}
            onDelete={(id) => dispatch(deleteNotification(id))}
            onClearAll={() => dispatch(clearAll())}
            onNotificationClick={(notification) => {
              if (notification.orderId) {
                navigate(`/orders`);
              }
            }}
          />

          {/* User Avatar - Opens Settings Drawer */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Abrir configuración"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </button>
        </div>
      </header>

      {/* Breadcrumbs Navigation */}
      <Breadcrumbs />

      <main className="flex-1">
        <Outlet />
      </main>

      <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 w-full pb-safe z-20 transition-colors duration-200">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={`${to}-${labelKey}`}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={() => {
          setIsSettingsOpen(false);
          setIsLogoutModalOpen(true);
        }}
      />

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro que deseas salir de tu cuenta?"
        confirmText="Salir"
        variant="danger"
      />
    </div>
  );
};
