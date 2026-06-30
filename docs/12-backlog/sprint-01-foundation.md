# Sprint 01 - Foundation

## Sprint Goal

Ship a production-ready foundation with working web app authentication and baseline deployment pipeline.

## Scope

- Monorepo configured
- Next.js app running
- Supabase connected for database/storage only
- Clerk authentication working
- Landing page
- Dashboard shell
- Design system baseline
- CI/CD baseline
- Deploy to Vercel

## Tickets

### AUTH-001 - Clerk Authentication Baseline

- **Epic**: Epic 1 - Foundation
- **Status**: Done
- **Product Specification**: Users can register/login/reset password and maintain authenticated sessions.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Sign In/Sign Up, Settings)
- **Database Changes**: Add/ensure `profiles.clerk_user_id` model contract in schema docs and migrations.
- **API Contract**: Protected APIs accept Clerk session/JWT; optional `POST /v1/auth/session/sync`.
- **Acceptance Criteria**:
  1. Sign-in and sign-up pages are available.
  2. Google OAuth option is visible.
  3. Protected dashboard route redirects unauthenticated users.
  4. Authenticated users can access dashboard shell.
- **Definition of Done**:
  - Clerk middleware configured.
  - Clerk provider mounted in app root.
  - Auth routes implemented.
  - Docs updated to Clerk standard.
- **Tests**:
  - Route protection integration test.
  - Auth page render smoke tests.
- **Dependencies**:
  - Sprint monorepo baseline.

### AUTH-002 - User Profile Sync Contract

- **Epic**: Epic 1 - Foundation
- **Status**: Done
- **Product Specification**: App stores profile metadata keyed by `clerk_user_id`.
- **UX Specification**: Settings profile section.
- **Database Changes**: `profiles` table schema and upsert policy.
- **API Contract**: `POST /v1/auth/session/sync`, `GET /v1/me`.
- **Acceptance Criteria**:
  1. First authenticated session creates/updates profile row.
  2. Profile retrieval works from backend.
- **Definition of Done**: profile sync path documented and implemented.
- **Artifacts**:
  - `apps/web/app/api/v1/auth/session/sync/route.ts`
  - `apps/web/app/api/v1/me/route.ts`
  - `apps/web/lib/auth/profile-sync.ts`
  - `docs/03-database/migrations/0001_profiles_clerk_user_id.sql`
- **Tests**: sync idempotency and profile fetch tests.
- **Dependencies**: AUTH-001.

### APP-001 - Application Shell

- **Epic**: Epic 1 - Foundation
- **Status**: Done
- **Product Specification**: Authenticated users see a reusable workspace shell with responsive navigation and top-level workspace controls.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Dashboard, Library)
- **Database Changes**: none.
- **API Contract**: none.
- **Acceptance Criteria**:
  1. Responsive sidebar and top navigation render on authenticated pages.
  2. Theme switch is available in shell header.
  3. Profile menu is available in shell header.
  4. Breadcrumbs and keyboard-shortcut placeholder are visible.
  5. Shell is reused by Dashboard and Library routes.
- **Definition of Done**:
  - Shared shell component implemented and consumed by authenticated pages.
  - Mobile sidebar toggle/close behavior implemented.
  - Navigation controls are keyboard reachable.
- **Artifacts**:
  - `apps/web/components/app-shell.tsx`
  - `apps/web/components/theme-toggle.tsx`
  - `apps/web/app/dashboard/page.tsx`
  - `apps/web/app/library/page.tsx`
  - `docs/05-design-system/README.md`
- **Tests**:
  - Manual shell responsiveness and keyboard navigation smoke verification.
- **Dependencies**:
  - AUTH-001

### DASH-001 - Dashboard Shell

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Authenticated users see dashboard shell with placeholders for modules.
- **UX Specification**: Dashboard page in UX spec and wireframes.
- **Database Changes**: none required for shell.
- **API Contract**: optional workspace list read.
- **Acceptance Criteria**:
  1. Dashboard route and shell layout render.
  2. Sidebar navigation matches V1 spec.
- **Definition of Done**: page uses design-system primitives and responsive layout.
- **Tests**: route render test and navigation smoke test.
- **Dependencies**: AUTH-001.

### DS-001 - Design System Baseline

- **Epic**: Epic 1 - Foundation
- **Status**: Done
- **Product Specification**: Core visual tokens and shared components available.
- **UX Specification**: `docs/05-design-system/README.md`.
- **Database Changes**: none.
- **API Contract**: none.
- **Acceptance Criteria**:
  1. Shared button/card/input/layout primitives in `packages/ui`.
  2. Theme tokens available in app.
- **Definition of Done**: components documented and consumed by landing/dashboard.
- **Tests**: component smoke tests.
- **Dependencies**: none.

### CICD-001 - Vercel CI/CD Baseline

- **Epic**: Epic 1 - Foundation
- **Status**: Done
- **Product Specification**: Preview/production deployment pipeline is repeatable.
- **UX Specification**: n/a.
- **Database Changes**: none.
- **API Contract**: none.
- **Acceptance Criteria**:
  1. Git push creates preview deploy.
  2. Main branch deploys production.
  3. CI runs lint/typecheck/build before deploy.
- **Definition of Done**: workflow file + deployment docs added.
- **Tests**: CI checks passing on PR.
- **Dependencies**: monorepo scripts and Vercel project link.

## Definition of Done (Sprint-Level)

- AUTH-001 complete and verified manually.
- Landing page and dashboard shell available.
- CI pipeline committed.
- Deployment guide updated for current setup.

## Sprint 01 Exit Status

- AUTH-001: Done
- AUTH-002: Done
- APP-001: Done
- DASH-001: Done
- DS-001: Done
- CICD-001: Done (workflow pnpm-version mismatch resolved; next push will validate live run)
