# Sprint 06 - Polish and Launch

## Sprint Goal

Harden Aproko AI for launch readiness with settings, billing, observability, and performance improvements.

## Scope

- Settings baseline
- Billing baseline
- Observability baseline
- Performance pass
- Launch checklist

## Tickets

### SET-001 - Settings Baseline

- **Status**: Done
- **Product Specification**: Users can manage profile details and baseline AI preferences from a protected settings page.
- **API Contract**:
  - `GET /api/v1/me`
  - `PATCH /api/v1/me`
- **Acceptance Criteria**:
  1. Settings page is navigable from app shell.
  2. Settings route is auth-protected.
  3. User can update profile full name.
  4. User can save baseline AI preferences.
  5. API route contract tests cover `GET` and `PATCH`.
- **Definition of Done**:
  - Settings page implemented in app shell.
  - Profile update route added to existing me API.
  - Middleware protects `/settings` and `/api/v1/me`.
  - Tests pass for me route.
- **Artifacts**:
  - `apps/web/app/settings/page.tsx`
  - `apps/web/app/api/v1/me/route.ts`
  - `apps/web/lib/auth/profile-sync.ts`
  - `apps/web/lib/settings/me-route.test.ts`
  - `apps/web/components/app-shell.tsx`
  - `apps/web/middleware.ts`

### BILL-001 - Billing Baseline

- **Status**: Done
- **Product Specification**: Users can view subscription status and billing period from a protected billing page, with upgrade/manage actions scaffolded.
- **API Contract**:
  - `GET /api/v1/billing/subscription?workspaceId={workspaceId}`
- **Acceptance Criteria**:
  1. Billing page is accessible from app shell navigation.
  2. Billing route and billing API are auth-protected.
  3. Current plan/status/provider and billing period are visible in UI.
  4. Billing API returns fallback free plan when subscription row is absent.
  5. Billing API contract tests pass.
- **Definition of Done**:
  - Billing storage module implemented.
  - Billing subscription API route implemented with dependency-injected handler.
  - Billing page shell implemented with subscription and usage snapshot sections.
  - Billing API route tests added and passing.
- **Artifacts**:
  - `apps/web/lib/storage/billing.ts`
  - `apps/web/app/api/v1/billing/subscription/route.ts`
  - `apps/web/app/billing/page.tsx`
  - `apps/web/lib/billing/subscription-route.test.ts`
  - `apps/web/components/app-shell.tsx`
  - `apps/web/middleware.ts`

### OBS-001 - Observability Baseline

- **Status**: Done
- **Product Specification**: Capture client and server errors plus product analytics events using environment-driven observability wiring.
- **API Contract**:
  - `POST /api/v1/observability/events`
  - `POST /api/v1/observability/errors`
- **Acceptance Criteria**:
  1. App captures page-view analytics events from client navigation.
  2. Global client errors are reported to observability error endpoint.
  3. Server routes can capture exceptions through shared helper.
  4. Sentry and PostHog wiring is environment-driven and safe when keys are absent.
  5. Observability API contract tests pass.
- **Definition of Done**:
  - Observability server utility implemented.
  - Observability API routes implemented with dependency-injected handlers.
  - Root layout includes observability provider for page events.
  - Global error boundary reports runtime failures.
  - Environment variable template updated with observability keys.
- **Artifacts**:
  - `apps/web/lib/observability/server.ts`
  - `apps/web/app/api/v1/observability/events/route.ts`
  - `apps/web/app/api/v1/observability/errors/route.ts`
  - `apps/web/components/observability-provider.tsx`
  - `apps/web/app/global-error.tsx`
  - `apps/web/sentry.server.config.ts`
  - `apps/web/sentry.edge.config.ts`
  - `apps/web/instrumentation-client.ts`
  - `apps/web/lib/observability/events-route.test.ts`
  - `apps/web/lib/observability/errors-route.test.ts`
  - `apps/web/.env.example`

### PERF-001 - Performance Pass

- **Status**: Done
- **Product Specification**: Improve initial app responsiveness by reducing client request waterfalls and adding lightweight response-performance metadata + caching hints on core authenticated GET routes.
- **API Contract**:
  - Existing endpoints enhanced with performance headers:
    - `GET /api/v1/me`
    - `GET /api/v1/billing/subscription`
    - `GET /api/v1/workspaces/{workspaceId}/notes`
    - `GET /api/v1/workspaces/{workspaceId}/flashcards/decks`
    - `GET /api/v1/workspaces/{workspaceId}/quizzes`
    - `GET /api/v1/workspaces/{workspaceId}/summaries`
- **Acceptance Criteria**:
  1. Core GET APIs include `server-timing` and `x-response-time` headers.
  2. Core GET APIs include private short-lived cache-control directives.
  3. Study page reduces redundant network calls after generation actions.
  4. Quiz detail + attempts loading no longer performs sequential request waterfall.
  5. Lint, typecheck, and tests pass after performance changes.
- **Definition of Done**:
  - Shared HTTP performance header utility implemented.
  - Core API routes instrumented with performance + cache headers.
  - Study page generation flows updated to avoid unnecessary refetches.
  - Quiz detail loading parallelized.
- **Artifacts**:
  - `apps/web/lib/perf/http.ts`
  - `apps/web/app/api/v1/me/route.ts`
  - `apps/web/app/api/v1/billing/subscription/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/notes/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/flashcards/decks/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/quizzes/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/summaries/route.ts`
  - `apps/web/app/study/page.tsx`

### LAUNCH-001 - Launch Hardening

- **Status**: Todo
- **Notes**: Final launch checklist and production readiness verification.

## Sprint 06 Exit Snapshot

- SET-001: Done
- BILL-001: Done
- OBS-001: Done
- PERF-001: Done
- LAUNCH-001: Todo
