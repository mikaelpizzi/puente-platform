/**
 * Web Push Notifications Service
 *
 * Features:
 * - Service Worker registration
 * - Push subscription management
 * - Permission handling
 * - VAPID key integration
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Check if push notifications are supported.
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current notification permission status.
 */
export function getNotificationPermission(): NotificationPermission {
  return Notification.permission;
}

/**
 * Request notification permission from user.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn('[Push] Push notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('[Push] Permission:', permission);
  return permission;
}

/**
 * Register service worker for push notifications.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[Push] Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[Push] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications.
 */
export async function subscribeToPush(): Promise<PushSubscriptionPayload | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Push] VAPID public key not configured');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('[Push] Notification permission not granted');
    return null;
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    return null;
  }

  try {
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    console.log('[Push] Subscription created:', subscription.endpoint);

    // Extract keys
    const rawKey = subscription.getKey('p256dh');
    const rawAuth = subscription.getKey('auth');

    if (!rawKey || !rawAuth) {
      throw new Error('Failed to get subscription keys');
    }

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(rawKey),
        auth: arrayBufferToBase64(rawAuth),
      },
    };
  } catch (error) {
    console.error('[Push] Subscription failed:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Push] Unsubscribed successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error);
    return false;
  }
}

/**
 * Check if user is subscribed to push.
 */
export async function isSubscribedToPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Convert VAPID key from URL-safe base64 to Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Convert ArrayBuffer to base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
