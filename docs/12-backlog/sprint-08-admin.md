# Sprint 08 - Admin Dashboard

## Sprint Goal

Ship the first admin dashboard surface with protected operational visibility into users, workspace footprint, and product usage.

## Scope

- Admin page baseline
- Admin API read endpoints
- Admin access guard

## Tickets

### ADMIN-001 - Admin Dashboard Baseline

- **Status**: Done
- **Product Specification**: Add a protected admin dashboard that exposes high-level system metrics and basic operational lists for users and workspaces.
- **API Contract**:
  - `GET /api/v1/admin/users`
  - `GET /api/v1/admin/workspaces`
  - `GET /api/v1/admin/usage`
- **Acceptance Criteria**:
  1. Admin page is accessible from app shell navigation.
  2. `/admin` and `/api/v1/admin/*` routes are auth-protected.
  3. Admin routes enforce admin access via role/allowlist guard.
  4. Admin page displays usage summary, users, and workspace footprint.
  5. Contract tests, lint, typecheck, unit tests, e2e, and build pass.
- **Definition of Done**:
  - Admin storage/service helpers implemented.
  - Admin API routes implemented with dependency-injected handlers.
  - Admin UI integrated in app shell.
  - Config template updated for admin guard env vars.
- **Artifacts**:
  - `apps/web/lib/auth/admin.ts`
  - `apps/web/lib/storage/admin.ts`
  - `apps/web/app/api/v1/admin/users/route.ts`
  - `apps/web/app/api/v1/admin/workspaces/route.ts`
  - `apps/web/app/api/v1/admin/usage/route.ts`
  - `apps/web/lib/admin/admin-api-routes.test.ts`
  - `apps/web/app/admin/page.tsx`
  - `apps/web/components/app-shell.tsx`
  - `apps/web/middleware.ts`
  - `apps/web/.env.example`

## Sprint 08 Exit Snapshot

- ADMIN-001: Done
