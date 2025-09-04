# Sentry Setup

1. Install dependencies (already added):
   - `sentry-expo`

2. In `.env` supply:
```
SENTRY_DSN=your_dsn_here
EXPO_PUBLIC_SENTRY_DSN=your_dsn_here
```

3. DSN exposure:
   - Public DSN is acceptable client side; server side secrets (auth tokens) must *not* be embedded.

4. Release & source maps (later):
   - Add an EAS build hook or GitHub Action to upload source maps with `sentry-expo upload-sourcemaps`.

5. Performance:
   - `tracesSampleRate` is set to 0.2 (20%). Adjust for cost.

6. Privacy / PII:
   - Redact user emails or set `sendDefaultPii: false` (default).
