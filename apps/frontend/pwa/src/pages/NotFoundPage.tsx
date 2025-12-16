import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <Search className="w-12 h-12 text-emerald-500" />
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('notFound.title')}</h2>
      <p className="text-gray-500 mb-8 max-w-xs mx-auto">{t('notFound.message')}</p>

      <Link
        to="/"
        className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-600 transition-transform active:scale-95"
      >
        <Home size={20} />
        {t('notFound.backHome')}
      </Link>
    </div>
  );
};
