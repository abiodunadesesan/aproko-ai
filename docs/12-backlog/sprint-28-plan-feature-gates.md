# Sprint 28 — Plan Feature Gates

## Status

- **State:** Implemented (web)
- **Depends on:** Sprint 27 billing tables + subscription sync

## Goal

Enforce plan entitlements (monthly AI query quotas) from workspace `subscriptions`.

## Scope

- Entitlement map: free 100 / teams 500 / pro unlimited per calendar month
- Usage counter (Upstash Redis when available; in-memory fallback)
- Gate AI chat, writing polish, and study generation with `402` when exhausted
- Soft warning when usage ≥ 80% of monthly limit
- Expose usage on `GET /api/v1/billing/subscription`
- Billing UI usage meter (+ chat soft banner)

## Done

- `lib/billing/plan-entitlements.ts` + `plan-usage.ts`
- Chat messages, writing polish, flashcard generate, and quiz generate consume quota
- Billing subscription payload includes `usage` (+ `nearingLimit` at ≥80%)
- Billing page meter + soft warning; chat soft banner when nearing limit
- Image uploads (png/jpg/webp/…) queue OCR like scanned PDFs

## Out of scope

- Per-seat Teams metering
- Token-level metering
- Paddle Customer Portal
