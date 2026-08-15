# Sprint 28 — Plan Feature Gates

## Status

- **State:** Implemented (web)
- **Depends on:** Sprint 27 billing tables + subscription sync

## Goal

Enforce plan entitlements (monthly AI query quotas) from workspace `subscriptions`.

## Scope

- Entitlement map: free 100 / teams 500 / pro unlimited per calendar month
- Usage counter (Upstash Redis when available; in-memory fallback)
- Gate AI chat message generation (`POST .../messages`) with `402` when exhausted
- Expose usage on `GET /api/v1/billing/subscription`
- Billing UI usage meter

## Done

- `lib/billing/plan-entitlements.ts` + `plan-usage.ts`
- Chat messages route consumes quota before streaming
- Billing subscription payload includes `usage`
- Billing page meter

## Out of scope

- Per-seat Teams metering
- Token-level metering
- Soft warnings at 80%
- Paddle Customer Portal
