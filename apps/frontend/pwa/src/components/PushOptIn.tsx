import { useState, useEffect } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
} from '../lib/pushNotifications';

interface PushOptInProps {
  onSubscribe?: (subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }) => void;
  onUnsubscribe?: () => void;
}

/**
 * Push Notification Opt-In Component
 *
 * Shows UI for users to enable/disable push notifications.
 */
export function PushOptIn({ onSubscribe, onUnsubscribe }: PushOptInProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSupported(isPushSupported());
    setPermission(getNotificationPermission());

    // Check subscription status
    isSubscribedToPush().then(setIsSubscribed);
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const subscription = await subscribeToPush();
      if (subscription) {
        setIsSubscribed(true);
        setPermission('granted');
        onSubscribe?.(subscription);
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribeFromPush();
      setIsSubscribed(false);
      onUnsubscribe?.();
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="push-optin push-optin--unsupported">
        <p className="text-gray-500 text-sm">
          Las notificaciones push no están soportadas en este navegador.
        </p>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="push-optin push-optin--denied">
        <div className="flex items-center gap-2 text-red-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          <span className="text-sm">Notificaciones bloqueadas</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Habilítalas desde la configuración del navegador.
        </p>
      </div>
    );
  }

  return (
    <div className="push-optin">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">Notificaciones Push</p>
            <p className="text-sm text-gray-500">
              {isSubscribed
                ? 'Recibirás alertas de pedidos y mensajes'
                : 'Activa para recibir alertas importantes'}
            </p>
          </div>
        </div>

        {isSubscribed ? (
          <button
            onClick={handleUnsubscribe}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Desactivando...' : 'Desactivar'}
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Activando...' : 'Activar'}
          </button>
        )}
      </div>
    </div>
  );
}

export default PushOptIn;
