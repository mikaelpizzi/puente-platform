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
import './index.css';

// Initialize observability before React mounts
initSentry();
initPostHog();

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
