import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { RequireAuth } from '../features/auth/RequireAuth';
import { InventoryDashboard } from '../features/inventory/InventoryDashboard';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { FinancePage } from '../pages/FinancePage';
import { LogisticsPage } from '../pages/LogisticsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { TrackingPage } from '../features/tracking/TrackingPage';
import { DashboardHome } from '../pages/DashboardHome';
import { ProfilePage } from '../features/profile/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/track',
    element: <PublicLayout />,
    children: [
      {
        path: ':trackingId',
        element: <TrackingPage />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <DashboardHome />,
      },
      {
        path: 'inventory',
        element: <InventoryDashboard />,
      },
      {
        path: 'checkout',
        element: <CheckoutPage />,
      },
      {
        path: 'finance',
        element: <FinancePage />,
      },
      {
        path: 'logistics',
        element: <LogisticsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
