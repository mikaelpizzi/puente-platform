import React from 'react';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

/**
 * Error boundary component for React Router.
 * Provides a user-friendly error page instead of the default error.
 */
export const ErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = 'Error inesperado';
  let message = 'Ha ocurrido un error al cargar esta página.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Página no encontrada';
      message = 'La página que buscas no existe o ha sido movida.';
    } else if (error.status === 403) {
      title = 'Acceso denegado';
      message = 'No tienes permiso para acceder a esta página.';
    } else if (error.status === 500) {
      title = 'Error del servidor';
      message = 'Hubo un problema en el servidor. Intenta de nuevo más tarde.';
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Ir al inicio
          </button>
        </div>

        {/* Show error details in dev mode */}
        {import.meta.env.DEV && error instanceof Error && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
              Detalles técnicos
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs text-red-600 dark:text-red-400 overflow-x-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};
