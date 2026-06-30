# Sprint 07 - Research Workspace

## Sprint Goal

Ship the first version of the Research workspace as an authenticated product surface that can evolve into scoped research projects.

## Scope

- Research workspace baseline page
- App shell navigation integration
- Protected route integration
- Research workspace CRUD API
- Research source-linking API
- Research UI data flow integration

## Tickets

### RESEARCH-001 - Research Workspace Baseline

- **Status**: Done
- **Product Specification**: Add an authenticated Research page to the app shell as a baseline surface for upcoming research workspace features.
- **Acceptance Criteria**:
  1. Research is visible and enabled in sidebar navigation.
  2. `/research` route is protected by Clerk middleware.
  3. Research page renders inside shared `AppShell` with clear baseline content.
  4. Lint and typecheck pass after integration.
- **Definition of Done**:
  - Research page created in app router.
  - App shell navigation updated with Research link.
  - Middleware updated to protect `/research`.
  - Quality checks pass.
- **Artifacts**:
  - `apps/web/app/research/page.tsx`
  - `apps/web/components/app-shell.tsx`
  - `apps/web/middleware.ts`

### RESEARCH-002 - Research Workspace CRUD

- **Status**: Done
- **Product Specification**: Users can list, create, update, and delete research workspaces inside a protected workspace scope.
- **API Contract**:
  - `GET /api/v1/workspaces/{workspaceId}/research/workspaces`
  - `POST /api/v1/workspaces/{workspaceId}/research/workspaces`
  - `PATCH /api/v1/workspaces/{workspaceId}/research/workspaces/{researchWorkspaceId}`
  - `DELETE /api/v1/workspaces/{workspaceId}/research/workspaces/{researchWorkspaceId}`
- **Acceptance Criteria**:
  1. CRUD routes are auth-protected.
  2. Create requires non-empty `title`.
  3. Update supports title/description edits.
  4. Delete removes workspace record.
  5. Contract tests pass for key success and auth cases.
- **Definition of Done**:
  - Storage module includes research workspace CRUD functions.
  - API route handlers are dependency-injected and testable.
  - Contract tests cover route behavior.
- **Artifacts**:
  - `apps/web/lib/storage/research.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/research/workspaces/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/research/workspaces/[researchWorkspaceId]/route.ts`
  - `apps/web/lib/research/research-api-routes.test.ts`

### RESEARCH-003 - Research Source Linking

- **Status**: Done
- **Product Specification**: Users can attach and detach existing library sources to/from a research workspace.
- **API Contract**:
  - `GET /api/v1/workspaces/{workspaceId}/research/workspaces/{researchWorkspaceId}/sources`
  - `POST /api/v1/workspaces/{workspaceId}/research/workspaces/{researchWorkspaceId}/sources`
  - `DELETE /api/v1/workspaces/{workspaceId}/research/workspaces/{researchWorkspaceId}/sources/{sourceId}`
- **Acceptance Criteria**:
  1. Linking requires `sourceId`.
  2. Source links are unique per workspace/research/source tuple.
  3. Unlink route removes association.
  4. Routes are protected and test-covered.
- **Definition of Done**:
  - Link table storage functions implemented.
  - Source-linking API routes implemented.
  - Contract tests include link/unlink behavior.
- **Artifacts**:
  - `apps/web/lib/storage/research.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/research/workspaces/[researchWorkspaceId]/sources/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/research/workspaces/[researchWorkspaceId]/sources/[sourceId]/route.ts`
  - `apps/web/lib/research/research-api-routes.test.ts`

### RESEARCH-004 - Research Workspace UI Integration

- **Status**: Done
- **Product Specification**: Research page loads real workspace and linked-source data, supports workspace creation, and supports source link/unlink actions.
- **Acceptance Criteria**:
  1. Research page fetches and renders research workspace list.
  2. Users can create a research workspace from UI.
  3. Users can link and unlink library sources.
  4. Empty/loading/error-ready state messaging is present.
  5. Lint, typecheck, unit tests, and e2e smoke pass.
- **Definition of Done**:
  - Research page converted into data-driven client flow.
  - E2E smoke includes `/research` route verification.
  - Supporting schema migration added for research tables.
- **Artifacts**:
  - `apps/web/app/research/page.tsx`
  - `apps/web/e2e/smoke.spec.ts`
  - `supabase/migrations/202606300002_create_research_tables.sql`

## Sprint 07 Exit Snapshot

- RESEARCH-001: Done
- RESEARCH-002: Done
- RESEARCH-003: Done
- RESEARCH-004: Done
