import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

// Route to breadcrumb mapping
const routeLabels: Record<string, string> = {
  '': 'Inicio',
  marketplace: 'Comprar',
  inventory: 'Inventario',
  orders: 'Pedidos',
  checkout: 'Cobrar',
  finance: 'Finanzas',
  logistics: 'Envíos',
  profile: 'Mi Perfil',
  track: 'Seguimiento',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on home page
  if (pathSegments.length === 0) {
    return null;
  }

  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Inicio', path: '/' }];

  let currentPath = '';
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || segment;
    breadcrumbs.push({ label, path: currentPath });
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700"
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={crumb.path}>
            {isFirst ? (
              <Link
                to={crumb.path}
                className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="sr-only">{crumb.label}</span>
              </Link>
            ) : isLast ? (
              <span className="font-medium text-gray-900 dark:text-white">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="hover:text-gray-700 dark:hover:text-gray-200 hover:underline transition-colors"
              >
                {crumb.label}
              </Link>
            )}
            {!isLast && <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
