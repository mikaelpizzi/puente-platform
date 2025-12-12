import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const userRole = user?.role;

  // Role-specific quick actions
  const sellerActions = [
    {
      title: 'Mi Inventario',
      icon: Package,
      path: '/inventory',
      color: 'bg-blue-500',
      description: 'Gestionar productos y stock',
    },
    {
      title: 'Mis Ventas',
      icon: ClipboardList,
      path: '/orders',
      color: 'bg-purple-500',
      description: 'Ver órdenes recibidas',
    },
    {
      title: 'Cobrar',
      icon: ShoppingCart,
      path: '/checkout',
      color: 'bg-emerald-500',
      description: 'Punto de venta y cobros QR',
    },
    {
      title: 'Finanzas',
      icon: DollarSign,
      path: '/finance',
      color: 'bg-yellow-500',
      description: 'Balance y transacciones',
    },
  ];

  const buyerActions = [
    {
      title: 'Explorar',
      icon: ShoppingCart,
      path: '/marketplace',
      color: 'bg-emerald-500',
      description: 'Buscar y comprar productos',
    },
    {
      title: 'Mis Compras',
      icon: ClipboardList,
      path: '/orders',
      color: 'bg-blue-500',
      description: 'Historial de pedidos',
    },
  ];

  const courierActions = [
    {
      title: 'Mis Entregas',
      icon: Truck,
      path: '/logistics',
      color: 'bg-emerald-600',
      description: 'Ver trabajos asignados',
    },
    {
      title: 'Mapa de Rutas',
      icon: MapPin,
      path: '/logistics',
      color: 'bg-blue-500',
      description: 'Navegación y seguimiento',
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
        return 'Aquí tienes un resumen de tu negocio hoy.';
      case 'BUYER':
        return '¿Qué quieres comprar hoy?';
      case 'COURIER':
        return 'Estas son tus entregas pendientes.';
      default:
        return 'Bienvenido a Puente.';
    }
  };

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 mt-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Hola, {user?.name || 'Usuario'} 👋
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
                Ventas Hoy
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
                Productos
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
              <p className="text-sm opacity-90">Entregas pendientes</p>
              <p className="text-4xl font-bold">0</p>
            </div>
            <Truck size={48} className="opacity-80" />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {userRole === 'COURIER' ? 'Acceso Rápido' : 'Acciones Rápidas'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.title}
            onClick={() => navigate(action.path)}
            className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all active:scale-[0.98] text-left group"
          >
            <div
              className={`p-4 rounded-xl ${action.color} text-white mr-4 shadow-lg group-hover:scale-110 transition-transform`}
            >
              <action.icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{action.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
