import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from './app/store';
import { router } from './app/router';
import { ThemeProvider } from './app/ThemeContext';
import { SocketProvider } from './providers/SocketProvider';
import { initSentry, initPostHog } from './lib';
import './i18n'; // Initialize i18n before React mounts
import './index.css';

// Initialize observability before React mounts
initSentry();
initPostHog();

// DEBUG: Remove after verifying Vercel env vars
console.log('🔧 DEBUG VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🔧 DEBUG VITE_WS_URL:', import.meta.env.VITE_WS_URL);
console.log('🔧 DEBUG VITE_ENABLE_SOCKET:', import.meta.env.VITE_ENABLE_SOCKET);
console.log('🔧 DEBUG MODE:', import.meta.env.MODE);
console.log('🔧 DEBUG PROD:', import.meta.env.PROD);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <SocketProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <RouterProvider router={router} />
        </SocketProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);
