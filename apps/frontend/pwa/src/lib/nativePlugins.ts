import { Geolocation, Position } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import {
  PushNotifications,
  PushNotificationSchema,
  ActionPerformed,
  Token,
} from '@capacitor/push-notifications';
import { App } from '@capacitor/app';

/**
 * Native Plugins Wrapper
 *
 * Provides unified access to Capacitor native APIs
 * with graceful fallbacks for web.
 */

// ==================== Geolocation ====================

/**
 * Check if geolocation is available.
 */
export async function checkGeolocationPermission(): Promise<boolean> {
  try {
    const status = await Geolocation.checkPermissions();
    return status.location === 'granted';
  } catch {
    return false;
  }
}

/**
 * Request geolocation permission.
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  try {
    const status = await Geolocation.requestPermissions();
    return status.location === 'granted';
  } catch {
    return false;
  }
}

/**
 * Get current position.
 */
export async function getCurrentPosition(): Promise<Position | null> {
  try {
    return await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
  } catch (error) {
    console.error('Failed to get position:', error);
    return null;
  }
}

/**
 * Watch position changes (for courier tracking).
 */
export async function watchPosition(
  callback: (position: Position) => void,
  errorCallback?: (error: any) => void,
): Promise<string> {
  const watchId = await Geolocation.watchPosition({ enableHighAccuracy: true }, (position, err) => {
    if (err) {
      errorCallback?.(err);
      return;
    }
    if (position) {
      callback(position);
    }
  });
  return watchId;
}

/**
 * Clear position watch.
 */
export async function clearWatch(watchId: string): Promise<void> {
  await Geolocation.clearWatch({ id: watchId });
}

// ==================== Camera ====================

/**
 * Take a photo.
 */
export async function takePhoto(): Promise<Photo | null> {
  try {
    return await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });
  } catch (error) {
    console.error('Failed to take photo:', error);
    return null;
  }
}

/**
 * Pick photo from gallery.
 */
export async function pickPhoto(): Promise<Photo | null> {
  try {
    return await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });
  } catch (error) {
    console.error('Failed to pick photo:', error);
    return null;
  }
}

// ==================== Push Notifications ====================

/**
 * Register for push notifications.
 */
export async function registerPushNotifications(): Promise<string | null> {
  try {
    // Request permission
    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== 'granted') {
      return null;
    }

    // Register with APNS/FCM
    await PushNotifications.register();

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', (token: Token) => {
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', () => {
        resolve(null);
      });
    });
  } catch (error) {
    console.error('Failed to register push:', error);
    return null;
  }
}

/**
 * Listen for push notifications.
 */
export function onPushNotification(callback: (notification: PushNotificationSchema) => void): void {
  PushNotifications.addListener('pushNotificationReceived', callback);
}

/**
 * Listen for push notification actions.
 */
export function onPushAction(callback: (action: ActionPerformed) => void): void {
  PushNotifications.addListener('pushNotificationActionPerformed', callback);
}

// ==================== App ====================

/**
 * Listen for app state changes.
 */
export function onAppStateChange(callback: (isActive: boolean) => void): void {
  App.addListener('appStateChange', ({ isActive }) => {
    callback(isActive);
  });
}

/**
 * Listen for back button (Android).
 */
export function onBackButton(callback: () => void): void {
  App.addListener('backButton', callback);
}

/**
 * Exit app (Android).
 */
export async function exitApp(): Promise<void> {
  await App.exitApp();
}

/**
 * Get app info.
 */
export async function getAppInfo() {
  return App.getInfo();
}
