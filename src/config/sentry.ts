import * as Sentry from 'sentry-expo';

// Initialization is light; DSN is optional until provided.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  enableInExpoDevelopment: false,
  debug: false,
  tracesSampleRate: 0.2
});