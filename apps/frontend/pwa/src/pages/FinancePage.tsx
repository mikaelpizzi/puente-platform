import React from 'react';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

export const FinancePage: React.FC = () => {
  return (
    <div className="p-4 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <DollarSign className="text-indigo-600 dark:text-indigo-400" />
        Finanzas
      </h2>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-6">
        <p className="text-indigo-100 text-sm font-medium mb-1">Balance Total</p>
        <h3 className="text-4xl font-bold">$12,450.00</h3>
        <div className="mt-4 flex gap-2">
          <span className="bg-white/20 px-2 py-1 rounded text-xs flex items-center gap-1">
            <TrendingUp size={12} /> +15% vs mes anterior
          </span>
        </div>
      </div>

      <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Movimientos Recientes</h3>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Venta #{1000 + i}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar size={10} /> Hoy, 10:30 AM
                </p>
              </div>
            </div>
            <span className="font-bold text-green-600 dark:text-green-400">+$450.00</span>
          </div>
        ))}
      </div>
    </div>
  );
};
