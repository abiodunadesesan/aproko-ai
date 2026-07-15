# Release V1 Checklist

## Status

- **Release target:** `Aproko AI Web V1`
- **State:** In Progress (quality and CI/CD gates passing; production deployment validation pending)

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

- [ ] Production environment variables verified (Clerk, Supabase, analytics, observability, billing).
- [x] Supabase migrations applied and confirmed (`supabase db push` in linked project).
- [ ] Clerk production settings verified (redirect URLs, OAuth providers, session settings).
- [ ] Storage bucket policies and CORS validated for production behavior.

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

- [x] GitHub `CI` workflow green on main (latest run: `28455414852`).
- [x] GitHub `Vercel Deploy` workflow green on main (latest run: `28455414496`, deploy path skipped because `VERCEL_TOKEN` is unset).
- [x] Vercel production deployment healthy and accessible (`https://aprokoai.vercel.app`, deployment `dpl_EM3yqb9mCQbPCUYC6mQKtd3XveMZ`).
- [x] Rollback path documented (see `docs/11-deployment/02-release-operations-runbook.md`).

### 5) Observability and Operations

- [ ] Sentry receiving frontend/server errors in production.
- [ ] PostHog events visible for critical flows.
- [ ] Alerting/escalation owners identified for launch week.
- [x] Basic operational runbook available for incident response (see `docs/11-deployment/02-release-operations-runbook.md`).

### 6) Security and Compliance Baseline

- [ ] Auth-protected routes and admin routes manually verified in production.
- [x] Secrets are not committed and are sourced from environment providers only (tracked file/pattern scan completed).
- [ ] Public API endpoints reviewed for auth/validation/rate-limit posture.
- [x] Rate limiting added to billing checkout/subscription and profile mutation routes; workspace write routes already covered (see `apps/web/lib/api/rate-limit.ts`).
- [x] Data retention and deletion behavior documented for user-facing support (see `docs/11-deployment/02-release-operations-runbook.md`).

### 7) Launch Execution

- [x] Final smoke test on production URL completed (root and sign-in return `200`; auth-protected route is guarded for signed-out users).
- [ ] Internal launch sign-off recorded (engineering + product).
- [ ] Public launch checklist completed (changelog/release note/announcement).
- [ ] Post-launch monitoring window scheduled (first 24-72h).

## Release Decision

- **Go/No-Go:** `TBD`
- **Release owner:** `TBD`
- **Planned release date:** `TBD`

## Notes

- Local release quality suite re-run and passing (`lint`, `typecheck`, `unit`, `e2e`, `build`).
- Supabase remote migration list confirms local/remote parity through `202606300003`.
- Last CI failure root cause: build required Clerk provider with an invalid placeholder key in CI.
- Mitigation added: layout now only mounts `ClerkProvider` when a valid publishable key is present.
- Last Vercel deploy failure root cause: missing `VERCEL_TOKEN` secret caused CLI `--token` empty error.
- Latest push-triggered runs are green for both `CI` and `Vercel Deploy`.
- Current deploy workflow status: passing in skip mode; production deploy remains blocked until `VERCEL_TOKEN` is configured.
- Production deploy performed via Vercel CLI; initial runtime failure (`MIDDLEWARE_INVOCATION_FAILED`) traced to Clerk env propagation under Turbo.
- Fixes applied: production Clerk keys synced, `turbo.json` `globalEnv` updated for Clerk/Supabase runtime variables, and production redeployed successfully.
- Release operations runbook added with explicit smoke/rollback/incident/data-handling procedures.
- Public API posture quick scan: auth and validation checks are broadly present in `app/api/v1`; explicit request rate limiting is not yet implemented and remains a release risk.
