import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error tracking.
 * Features:
 * - Automatic error boundary
 * - PII scrubbing
 * - Performance monitoring
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_APP_VERSION || '0.1.0',

    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Session replay (optional)
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 0.5,

    // PII Scrubbing - remove sensitive data
    beforeSend(event) {
      // Scrub email addresses from breadcrumbs and messages
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
          ...breadcrumb,
          message: scrubPII(breadcrumb.message),
        }));
      }

      // Scrub user data
      if (event.user) {
        event.user = {
          id: event.user.id, // Keep ID for tracking
          // Remove email, username, ip_address
        };
      }

      return event;
    },

    // Ignore common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      /Loading chunk \d+ failed/,
      'Network Error',
    ],

    // Integration settings
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });

  console.log('[Sentry] Initialized successfully');
}

/**
 * Scrub PII from text.
 */
function scrubPII(text?: string): string | undefined {
  if (!text) return text;

  // Scrub email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  let scrubbed = text.replace(emailRegex, '[EMAIL_REDACTED]');

  // Scrub phone numbers (Venezuelan format)
  const phoneRegex = /(\+?58)?[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g;
  scrubbed = scrubbed.replace(phoneRegex, '[PHONE_REDACTED]');

  // Scrub credit card patterns
  const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  scrubbed = scrubbed.replace(ccRegex, '[CC_REDACTED]');

  return scrubbed;
}

/**
 * Capture a custom error with context.
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context });
}

/**
 * Set user context for Sentry.
 */
export function setSentryUser(userId: string) {
  Sentry.setUser({ id: userId });
}

/**
 * Clear user context.
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

export { Sentry };
