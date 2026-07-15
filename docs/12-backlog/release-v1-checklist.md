# Release V1 Checklist

## Status

- **Release target:** `Aproko AI Web V1`
- **State:** **Launched** (2026-07-15) — https://aprokoai.vercel.app

## Go-Live Gates

### 1) Product and UX Validation

- [x] Core user journeys validated end-to-end (auth, library, chat, memory, study, research, admin). Library upload verified on production 2026-07-15.
- [x] Empty/loading/error states reviewed on all primary pages (engineering smoke + E2E coverage).
- [ ] Navigation and responsive behavior spot-checked on desktop and mobile web breakpoints.
- [ ] Final copy and labels reviewed for consistency and clarity.

**Engineering status (2026-07-15):** E2E suite covers auth shell, library upload, chat citations, billing checkout, and smoke routes.

### 2) Quality and Stability

- [x] `pnpm --filter web lint` passes.
- [x] `pnpm --filter web typecheck` passes.
- [x] `pnpm --filter web test` passes.
- [x] `pnpm test:e2e:web` passes.
- [x] `pnpm --filter web build` passes.

### 3) Infrastructure and Environment

- [x] Production environment variables verified for auth, data, rate limits, and Sentry.
- [x] `NEXT_PUBLIC_APP_URL` and Clerk force-redirect URLs set on Vercel Production.
- [x] Supabase migrations applied (`202607151001` library bucket applied 2026-07-15).
- [x] Clerk production keys on Vercel; redirect env vars configured (dashboard allow-list still recommended).
- [x] Storage bucket and production upload verified 2026-07-15.
- [ ] `POSTHOG_API_KEY` (deferred — optional for V1 launch).

### 4) CI/CD and Deployment

- [x] GitHub `CI` workflow green on main.
- [x] GitHub `Vercel Deploy` performs real deploys (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` configured).
- [x] Vercel production healthy: https://aprokoai.vercel.app
- [x] Rollback path documented (`docs/11-deployment/02-release-operations-runbook.md`).

### 5) Observability and Operations

- [x] Sentry routes verified in production (`/sentry-example-page` 200; `/api/sentry-example-api` 500 fault injection).
- [x] Sentry error triggered via production API (2026-07-15).
- [ ] PostHog events (deferred).
- [x] Monitoring window: 2026-07-15 → 2026-07-18 (72h post-launch).
- [x] Operational runbook available.

### 6) Security and Compliance Baseline

- [x] Auth-protected API routes guarded (`/api/v1/me` returns `307` unsigned).
- [x] Secrets not committed; sourced from env providers.
- [x] API auth/validation/rate-limit posture reviewed.
- [x] Data retention and deletion documented.

### 7) Launch Execution

- [x] Final production smoke test (2026-07-15).
- [x] Engineering launch sign-off (2026-07-15).
- [x] GitHub Release **v1.0.0** published: https://github.com/abiodunadesesan/aproko-ai/releases/tag/v1.0.0
- [x] Changelog available: `docs/12-backlog/v1-launch-changelog.md`
- [x] Post-launch monitoring window scheduled (72h from 2026-07-15).

## Release Decision

- **Go/No-Go:** `Go`
- **Release owner:** Engineering (2026-07-15)
- **Launch date:** 2026-07-15
- **Production URL:** https://aprokoai.vercel.app

## Notes

- Library upload confirmed working on production after Supabase restore + `202607151001` migration.
- Clerk redirect allow-list in Dashboard still recommended if OAuth sign-in shows redirect errors.
- Optional post-launch: remove `/sentry-example-page`, add PostHog, configure Stripe for live billing.
