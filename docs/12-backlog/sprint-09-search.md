# Sprint 9 - Search

## Status

- **Current ticket:** `SEARCH-002`
- **State:** Done

## Ticket: SEARCH-002 - Workspace Search Baseline

### Product Spec

Users can search across workspace knowledge assets from a dedicated Search screen.

### Scope

- Add dedicated `/search` page in authenticated app shell.
- Add `GET /api/v1/workspaces/{workspaceId}/search?q=...` API.
- Search over `sources`, `notes`, and `memory_items` for workspace.
- Render grouped, navigable result cards.
- Add route-level contract tests and e2e smoke test coverage.

### API Contract

- **Method:** `GET`
- **Path:** `/api/v1/workspaces/{workspaceId}/search`
- **Auth:** required Clerk session.
- **Query params:**
  - `q` (required, string)
- **Response 200:**
  - `{ data: SearchResult[] }`
- **SearchResult:**
  - `id: string`
  - `type: "source" | "note" | "memory"`
  - `title: string`
  - `snippet: string`
  - `metadata?: Record<string, string | number | null>`

### Acceptance Criteria

- Authenticated user can open `/search`.
- User can query workspace data and receive results from notes/sources/memory.
- API returns `401` for unauthenticated requests.
- API returns `400` when `q` is missing.
- Search page supports loading, empty, and error states.
- Navigation includes Search entry in app shell.

### Definition of Done

- Feature implemented and wired into navigation.
- API route covered by automated tests.
- E2E smoke includes search page load.
- Lint, typecheck, tests, and build pass.

### Artifacts

- `apps/web/app/search/page.tsx`
- `apps/web/app/api/v1/workspaces/[workspaceId]/search/route.ts`
- `apps/web/lib/storage/search.ts`
- `apps/web/lib/search/search-route.test.ts`
- `apps/web/e2e/smoke.spec.ts`
- `apps/web/components/app-shell.tsx`
- `apps/web/middleware.ts`
