# Playwright E2E (Web App)

This suite covers a small smoke set for `apps/web` only.

## Scope

- Landing page loads
- Sign-in page loads
- Signed-out users are redirected from `/dashboard`
- App shell renders with e2e mock auth
- Sidebar navigation links exist
- Library page loads

AI chat and file upload flows are intentionally excluded for now.

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
cookie explicitly.

This keeps signed-out redirect coverage intact while enabling lightweight authenticated UI checks.

## Environment and secrets

- Never commit real `CLERK_*`, `SUPABASE_*`, or `REDIS_*` secrets.
- Keep real values only in local ignored files like `.env.local`.
- Prefer test keys (`pk_test_*`, `sk_test_*`) for auth testing environments.
