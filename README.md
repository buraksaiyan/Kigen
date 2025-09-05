# Kigen (MVP Scaffold)

A React Native (Expo + TypeScript) mobile app to reduce social media addiction using a **Focus Rating** system, journaling boosts, and ego-style nudges.  
This MVP intentionally defers the in-app DP (Discipline Points) economy; code paths are prepared but not exposed.

## Current MVP Scope (Active)
- Supabase Auth + profiles
- Focus Rating (ledger-based events)
- Journaling (+ rating event)
- Android usage tracking (stub service to be replaced with real UsageStats integration)
- OneSignal + AdMob placeholders
- Trial + subscription gating logic scaffold
- Feature flags (DP disabled)
- LemonSqueezy webhook Edge Function scaffold
- Mistake allowance model (purchase refresh postponed until DP enabled)

## Deferred / Future (Prepared, Hidden)
- DP economy & shop
- Subscription → monthly DP credit consumption logic
- Creator ecosystem, leaderboards, streaks, social layer

## Tech Stack
- React Native (Expo)
- TypeScript
- Zustand (state management)
- Supabase (Auth + DB + Edge Functions)
- OneSignal (push notifications)
- AdMob (ads)
- LemonSqueezy (payments/subscriptions)

## Getting Started

1. `cp .env.example .env` and fill values.
2. Install dependencies:
   - `pnpm install` (recommended) or `yarn` or `npm install`
3. Run: `pnpm dev`
4. Sign up a test user; profile auto-hydrates.
5. Add a journal entry → rating event and gauge update.

## Environment Variables

See `.env.example` (only variables prefixed with `EXPO_PUBLIC_` are exposed to the app bundle).

## Feature Flags

`src/config/featureFlags.ts`:
```ts
export const featureFlags = {
  ENABLE_DP: false
};
```
Switch to `true` later when DP UI and purchasing are enabled.

## Database Schema

Run `supabase/migrations/001_init.sql`.

## LemonSqueezy Webhooks

Edge Function scaffold: `supabase/functions/ls-webhooks` (signature verification TODO).  
Events relevant now: subscription lifecycle (trial/active/expired). DP crediting is deferred.

## Rating Model

Events appended to `rating_events`. The live rating in store is updated optimistically; you can recompute server-side later if needed.

## Mistake Allowance

3/week base. Future refresh purchases (DP gated) are hidden until DP activated.

## Priority Task Board (Suggested)

| Priority | Task |
|----------|------|
| High | Implement real Android UsageStats + permission UI |
| High | Subscription checkout flow + trial expiry enforcement |
| High | OneSignal push + nudge throttle logic (30m) |
| Medium | Weekly mistake allowance recalculation (derive by ISO week or scheduled job) |
| Medium | Paywall gating logic after trial end |
| Low | DP economy exposure & purchase flows |
| Low | Ads optimization & frequency rules |

## Contributing (Internal)
Use feature branches:  
`feat/usage-tracking`, `feat/subscriptions`, `feat/nudges`, etc.

## Proprietary
See `NOTICE_INTERNAL.md`.

---
If you want enhancements scaffolded (usage tracking native module, subscription flow), open an issue or request here.
