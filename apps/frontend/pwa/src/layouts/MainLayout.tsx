import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Home, Package, DollarSign, Truck, ShoppingCart, LogOut, Moon, Sun } from 'lucide-react';
import { OfflineSyncManager } from '../features/inventory/OfflineSyncManager';
import { logout } from '../features/auth/authSlice';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { useTheme } from '../app/ThemeContext';

export const MainLayout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navItems = [
    { to: '/', icon: Package, label: 'Inventario' },
    { to: '/checkout', icon: ShoppingCart, label: 'Cobrar' },
    { to: '/finance', icon: DollarSign, label: 'Finanzas' },
    { to: '/logistics', icon: Truck, label: 'Envíos' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <OfflineSyncManager />

      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center transition-colors duration-200">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Puente</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 w-full pb-safe z-20 transition-colors duration-200">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

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
