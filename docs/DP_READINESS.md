# Data Protection Readiness (Initial Draft)

Status: DRAFT – Non-production.

## 1. Data Inventory
- User profile (email via Supabase auth)
- Journal entries (title, body, timestamps, user_id)

## 2. Data Residency
- Depends on Supabase project region (configure in dashboard).

## 3. Minimization
- Only essential journaling fields stored.
- No analytics events yet.

## 4. Security Controls
- Supabase RLS (enable and verify).
- HTTPS enforced by Supabase.
- Client stores only session token.

## 5. Retention
- No automated purge yet. Future: soft delete + retention policy.

## 6. Subject Requests
- Export: Future function to dump all journal entries (CSV/JSON).
- Deletion: Manual SQL or future endpoint.

## 7. Incident Response
- Add runtime error monitoring and logging.
- Add runbook for breach assessment (TODO).

## 8. Next Steps
- Enable RLS policies (see migration TODO comments).
- Add logging for admin review (server-side only).
- Document data flow diagram.

This file will evolve as compliance scope expands.