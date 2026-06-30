# Release V1 Checklist

## Status

- **Release target:** `Aproko AI Web V1`
- **State:** In Progress (quality gates passing; deployment validation pending new main run)

## Go-Live Gates

### 1) Product and UX Validation

- [ ] Core user journeys validated end-to-end (auth, library, chat, memory, study, research, admin).
- [ ] Empty/loading/error states reviewed on all primary pages.
- [ ] Navigation and responsive behavior spot-checked on desktop and mobile web breakpoints.
- [ ] Final copy and labels reviewed for consistency and clarity.

### 2) Quality and Stability

- [x] `pnpm --filter web lint` passes.
- [x] `pnpm --filter web typecheck` passes.
- [x] `pnpm --filter web test` passes.
- [x] `pnpm test:e2e:web` passes.
- [x] `pnpm --filter web build` passes.

### 3) Infrastructure and Environment

- [ ] Production environment variables verified (Clerk, Supabase, analytics, observability, billing).
- [x] Supabase migrations applied and confirmed (`supabase db push` in linked project).
- [ ] Clerk production settings verified (redirect URLs, OAuth providers, session settings).
- [ ] Storage bucket policies and CORS validated for production behavior.

### 4) CI/CD and Deployment

- [ ] GitHub `CI` workflow green on main (awaiting new run after workflow pnpm-version fix).
- [ ] GitHub `Vercel Deploy` workflow green on main (awaiting new run after workflow pnpm-version fix).
- [ ] Vercel production deployment healthy and accessible.
- [ ] Rollback path documented (previous deployment promotion and revert steps).

### 5) Observability and Operations

- [ ] Sentry receiving frontend/server errors in production.
- [ ] PostHog events visible for critical flows.
- [ ] Alerting/escalation owners identified for launch week.
- [ ] Basic operational runbook available for incident response.

### 6) Security and Compliance Baseline

- [ ] Auth-protected routes and admin routes manually verified in production.
- [ ] Secrets are not committed and are sourced from environment providers only.
- [ ] Public API endpoints reviewed for auth/validation/rate-limit posture.
- [ ] Data retention and deletion behavior documented for user-facing support.

### 7) Launch Execution

- [ ] Final smoke test on production URL completed.
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
- CI/CD gate remains blocked until next push to `main` triggers fresh GitHub workflow runs.
