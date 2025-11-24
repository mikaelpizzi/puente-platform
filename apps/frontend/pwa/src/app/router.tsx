import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <div className="p-4">Dashboard Placeholder</div>,
      },
      // Other routes will be added here
    ],
  },
]);
