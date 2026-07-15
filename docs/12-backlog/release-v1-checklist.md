# Release V1 Checklist

## Status

- **Release target:** `Aproko AI Web V1`
- **State:** Launch-ready pending product sign-off and final manual validation

## Go-Live Gates

### 1) Product and UX Validation

- [ ] Core user journeys validated end-to-end (auth, library, chat, memory, study, research, admin).
- [ ] Empty/loading/error states reviewed on all primary pages.
- [ ] Navigation and responsive behavior spot-checked on desktop and mobile web breakpoints.
- [ ] Final copy and labels reviewed for consistency and clarity.

**Engineering status (2026-07-14):** E2E suite covers auth shell, library upload, chat citations, billing checkout, and smoke routes. Run `pnpm e2e:install` once per machine, then `pnpm test:e2e:web`.

### 2) Quality and Stability

- [x] `pnpm --filter web lint` passes.
- [x] `pnpm --filter web typecheck` passes.
- [x] `pnpm --filter web test` passes.
- [x] `pnpm test:e2e:web` passes (run `pnpm e2e:install` once per machine, then `pnpm test:e2e:web`).
- [x] `pnpm --filter web build` passes.

### 3) Infrastructure and Environment

- [x] Production environment variables verified for auth, data, rate limits, and Sentry (Clerk, Supabase, Upstash, Sentry DSNs on Production).
- [x] `NEXT_PUBLIC_APP_URL` and Clerk force-redirect URLs set on Vercel Production (2026-07-15).
- [x] Supabase migrations applied and confirmed (`supabase db push` in linked project).
- [ ] Clerk production settings verified (redirect URLs, OAuth providers, session settings).
- [ ] Storage bucket policies and CORS validated for production behavior.
- [ ] `POSTHOG_API_KEY` and `NEXT_PUBLIC_APP_URL` added to Vercel (deferred if analytics/billing not in launch scope).

**Required production env vars** (see `apps/web/.env.example`):

| Group         | Variables                                                                   |
| ------------- | --------------------------------------------------------------------------- |
| Auth          | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`                     |
| Data          | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`                     |
| Rate limits   | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                        |
| Observability | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `POSTHOG_API_KEY`                   |
| Billing       | `BILLING_PROVIDER`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs |
| Deploy        | `VERCEL_TOKEN` (GitHub Actions), `NEXT_PUBLIC_APP_URL`                      |

### 4) CI/CD and Deployment

- [x] GitHub `CI` workflow green on main (latest run: `29406111644`, commit `7d60693`).
- [x] GitHub `Vercel Deploy` workflow performs real deploys (`VERCEL_TOKEN` configured 2026-07-15).
- [x] Vercel production deployment healthy and accessible (`https://aprokoai.vercel.app`, deployment `dpl_GAoVMYdj7PwfDipRBevnRHJkcKyJ`).
- [x] Rollback path documented (see `docs/11-deployment/02-release-operations-runbook.md`).

### 5) Observability and Operations

- [x] Sentry example route reachable in production (`/sentry-example-page` returns `200`; `/api/sentry-example-api` returns `500` as expected).
- [ ] Sentry issue confirmed in dashboard after triggering example error (manual check in Sentry UI).
- [ ] PostHog events visible for critical flows.
- [ ] Alerting/escalation owners identified for launch week.
- [x] Basic operational runbook available for incident response (see `docs/11-deployment/02-release-operations-runbook.md`).

### 6) Security and Compliance Baseline

- [x] Auth-protected API routes return redirect/guard for signed-out users in production (`/api/v1/me`, `/api/v1/billing/subscription`, `/api/v1/admin/users` return `307`).
- [x] Secrets are not committed and are sourced from environment providers only (tracked file/pattern scan completed).
- [x] Public API endpoints reviewed for auth/validation/rate-limit posture (billing checkout/subscription and profile mutation routes rate-limited).
- [x] Rate limiting added to billing checkout/subscription and profile mutation routes; workspace write routes already covered (see `apps/web/lib/api/rate-limit.ts`).
- [x] Data retention and deletion behavior documented for user-facing support (see `docs/11-deployment/02-release-operations-runbook.md`).

### 7) Launch Execution

- [x] Final smoke test on production URL completed (2026-07-15): core routes return `200`; auth APIs guarded with `307`.
- [x] Engineering launch sign-off recorded (2026-07-15): CI green, production deploy healthy, Sentry integrated, smoke checks passing.
- [ ] Product launch sign-off recorded.
- [ ] Public launch checklist completed (changelog/release note/announcement).
- [ ] Post-launch monitoring window scheduled (first 24-72h).

## Release Decision

- **Go/No-Go:** `Go` (engineering) / `Pending` (product)
- **Release owner:** `Engineering: completed 2026-07-15` / `Product: TBD`
- **Planned release date:** `TBD`

## Notes

- Local release quality suite re-run and passing (`lint`, `typecheck`, `unit`, `e2e`, `build`).
- Supabase remote migration list confirms local/remote parity through `202606300003`.
- CI typecheck failure on Sentry commit (`5efadb9`) fixed in `7d60693` by conditionally passing `authToken` to `withSentryConfig`.
- GitHub CI run `29406111644` green after fix (lint, typecheck, build).
- Production smoke test (2026-07-15): `/`, `/sign-in`, `/sign-up`, `/dashboard`, `/library`, `/chat`, `/memory`, `/study`, `/research`, `/billing`, `/settings`, `/admin`, `/sentry-example-page` all return `200`.
- Sentry example API returns `500` in production (expected fault injection).
- `VERCEL_TOKEN` GitHub secret configured (2026-07-15); next push triggers real deploy pipeline.
- Production deploy performed via Vercel CLI; deployment `dpl_GAoVMYdj7PwfDipRBevnRHJkcKyJ` aliased to `https://aprokoai.vercel.app`.
- Release operations runbook available with explicit smoke/rollback/incident/data-handling procedures.
