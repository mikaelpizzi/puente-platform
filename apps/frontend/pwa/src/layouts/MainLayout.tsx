import React from 'react';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">Puente</h1>
      </header>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
      <nav className="bg-white border-t border-gray-200 p-2 fixed bottom-0 w-full flex justify-around pb-safe">
        {/* Navigation items will go here */}
        <div className="text-xs text-center">Home</div>
        <div className="text-xs text-center">Inventory</div>
        <div className="text-xs text-center">Finance</div>
        <div className="text-xs text-center">Logistics</div>
      </nav>
    </div>
  );
};
