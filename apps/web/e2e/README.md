# Playwright E2E (Web App)

This suite covers smoke checks and critical user journeys for `apps/web`.

## Scope

### Smoke (`smoke.spec.ts`)

- Landing and sign-in pages load
- Signed-out users are redirected from protected routes
- App shell renders with e2e mock auth
- Sidebar navigation links exist
- Core app pages load (dashboard, library, search, research, admin, transcripts, memory, study)

### Journeys (`journeys.spec.ts`)

- Auth → dashboard shell
- Library file upload (mocked API) appears in sources table
- Chat assistant response includes citations (mocked SSE)

### Billing (`billing.spec.ts`)

- Billing checkout from plan selection shows staging pending message (mocked checkout API)
- Billing webhook POST returns structured payload when Stripe is not configured

## Run locally

From repo root:

```bash
pnpm test:e2e:web
```

From `apps/web`:

```bash
pnpm e2e
```

Optional:

```bash
pnpm e2e:install
pnpm e2e:headed
pnpm e2e:ui
```

## Auth behavior in tests

Playwright starts Next.js with `E2E_MOCK_AUTH=true`.

When this flag is enabled, middleware allows protected routes only if the
`aproko_e2e_auth=1` cookie is present. Tests that need authenticated shell behavior set this
cookie explicitly via `enableMockAuth()`.

This keeps signed-out redirect coverage intact while enabling lightweight authenticated UI checks.

Workspace and billing API calls are mocked in journey tests with Playwright `page.route()`.

## Environment and secrets

- Never commit real `CLERK_*`, `SUPABASE_*`, or `REDIS_*` secrets.
- Keep real values only in local ignored files like `.env.local`.
- Prefer test keys (`pk_test_*`, `sk_test_*`) for auth testing environments.
