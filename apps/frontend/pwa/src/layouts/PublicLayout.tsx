import React from 'react';
import { Outlet } from 'react-router-dom';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Simple Header for Brand Trust */}
      <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 flex justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Puente
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Simple Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 py-6 text-center text-gray-400 dark:text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Puente Platform. Powered by WorkerTech.</p>
      </footer>
    </div>
  );
};
