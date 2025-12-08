import posthog from 'posthog-js';

/**
 * Initialize PostHog for analytics and feature flags.
 * Features:
 * - Page view tracking
 * - Custom event capture
 * - PII masking
 * - Session replay
 */
export function initPostHog() {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    console.warn('[PostHog] API key not configured, skipping initialization');
    return;
  }

  posthog.init(apiKey, {
    api_host: apiHost,

    // Privacy settings
    respect_dnt: true,
    mask_all_text: true,
    mask_all_element_attributes: true,

    // Session replay
    disable_session_recording: !import.meta.env.PROD,
    session_recording: {
      maskTextSelector: '*',
      maskInputOptions: {
        password: true,
        email: true,
        tel: true,
      },
    },

    // Performance
    loaded: (posthogInstance) => {
      if (!import.meta.env.PROD) {
        posthogInstance.debug();
      }
    },

    // Bootstrap with feature flags
    bootstrap: {
      featureFlags: {},
    },
  });

  console.log('[PostHog] Initialized successfully');
}

// ==========================================
// Event Tracking
// ==========================================

/**
 * Track custom event.
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  posthog.capture(eventName, properties);
}

/**
 * Track page view.
 */
export function trackPageView(pageName: string, properties?: Record<string, unknown>) {
  posthog.capture('$pageview', {
    page: pageName,
    ...properties,
  });
}

// ==========================================
// Key Business Events
// ==========================================

export const PostHogEvents = {
  // Auth
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',

  // Inventory
  PRODUCT_CREATED: 'product_created',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',

  // Checkout
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  CHECKOUT_ABANDONED: 'checkout_abandoned',

  // Orders
  ORDER_CREATED: 'order_created',
  ORDER_ACCEPTED: 'order_accepted',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',

  // Delivery
  DELIVERY_ASSIGNED: 'delivery_assigned',
  DELIVERY_PICKED_UP: 'delivery_picked_up',
  DELIVERY_COMPLETED: 'delivery_completed',

  // Disputes
  DISPUTE_OPENED: 'dispute_opened',
  DISPUTE_RESOLVED: 'dispute_resolved',
} as const;

// ==========================================
// User Identification
// ==========================================

/**
 * Identify user (after login).
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  posthog.identify(userId, {
    // Sanitize traits - no PII
    role: traits?.role,
    createdAt: traits?.createdAt,
  });
}

/**
 * Reset user (after logout).
 */
export function resetUser() {
  posthog.reset();
}

// ==========================================
// Feature Flags
// ==========================================

/**
 * Check if feature flag is enabled.
 */
export function isFeatureEnabled(flagKey: string): boolean {
  return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Get feature flag value.
 */
export function getFeatureFlag<T>(flagKey: string): T | undefined {
  return posthog.getFeatureFlag(flagKey) as T | undefined;
}

export { posthog };
