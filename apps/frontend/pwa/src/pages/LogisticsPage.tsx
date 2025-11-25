import React from 'react';
import { Truck, MapPin, Package } from 'lucide-react';

export const LogisticsPage: React.FC = () => {
  return (
    <div className="p-4 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <Truck className="text-indigo-600 dark:text-indigo-400" />
        Mis Envíos
      </h2>

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex justify-between items-start mb-3">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full">
              EN CAMINO
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">#TRK-8821</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Package className="text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Juan Pérez</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">2 items • $450.00</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
            <MapPin size={16} className="text-indigo-500 dark:text-indigo-400" />
            <span>Av. Reforma 222, CDMX</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 opacity-75 transition-colors duration-200">
          <div className="flex justify-between items-start mb-3">
            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-bold px-2 py-1 rounded-full">
              ENTREGADO
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">#TRK-8820</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Package className="text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Maria Gonzalez</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">1 item • $120.00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
