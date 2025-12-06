import React, { useState } from 'react';
import { Package, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

// Mock Data Types
interface Order {
  id: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: { name: string; quantity: number; price: number }[];
  customer?: string; // For seller view
  seller?: string; // For buyer view
}

// Mock Data Generator
const generateMockOrders = (role: 'buyer' | 'seller'): Order[] => {
  return Array.from({ length: 10 }).map((_, i) => ({
    id: `ORD-${2024000 + i}`,
    date: new Date(Date.now() - i * 86400000).toISOString(),
    total: Math.floor(Math.random() * 500) + 50,
    status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][
      Math.floor(Math.random() * 5)
    ] as any,
    items: [
      { name: 'Producto Ejemplo ' + (i + 1), quantity: 1, price: 100 },
      { name: 'Otro Item', quantity: 2, price: 50 },
    ],
    customer: role === 'seller' ? `Cliente ${i + 1}` : undefined,
    seller: role === 'buyer' ? `Vendedor ${i + 1}` : undefined,
  }));
};

export const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // In a real app, we would fetch this data based on the activeTab and user ID
  const orders = generateMockOrders(activeTab);

  const filteredOrders =
    filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);

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
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      processing: 'Procesando',
      shipped: 'En Camino',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  return (
    <div className="pb-24 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow p-4 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Mis Pedidos</h2>

        {/* Role Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab('buyer')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'buyer'
                ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Mis Compras
          </button>
          <button
            onClick={() => setActiveTab('seller')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'seller'
                ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Mis Ventas
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Todos' : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 dark:text-white">{order.id}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      • {new Date(order.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {activeTab === 'buyer' ? order.seller : order.customer}
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
            <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-2 flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Ver detalles</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
