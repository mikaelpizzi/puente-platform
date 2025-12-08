import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.puente.app',
  appName: 'Puente',
  webDir: 'dist',

  // Server configuration
  server: {
    // Use localhost for development
    url: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : undefined,
    cleartext: true, // Allow HTTP in development
  },

  // Android specific settings
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    },
    // Background location permission
    allowMixedContent: true,
  },

  // iOS specific settings
  ios: {
    contentInset: 'automatic',
    scheme: 'Puente',
  },

  // Plugin configurations
  plugins: {
    // Geolocation plugin
    Geolocation: {
      // Enable background location for courier tracking
    },

    // Push notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Camera
    Camera: {
      // Camera settings
    },
  },
};

export default config;
