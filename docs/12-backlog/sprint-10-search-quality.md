# Sprint 10 - Search Quality

## Status

- **Current ticket:** `SEARCH-003`
- **State:** Done

## Ticket: SEARCH-003 - Search Filtering, Ranking, and Correct Links

### Product Spec

Improve search quality and usability so users can quickly find the right item type and navigate to the correct destination.

### Scope

- Add type filtering support (`all`, `source`, `note`, `memory`) in the search API.
- Add query limit support with validation.
- Add relevance sorting heuristic for mixed-type results.
- Fix source result identifiers to use real source IDs for valid document navigation.
- Add grouped results presentation for "All" view in Search page.
- Extend route tests for filter/limit validation and option forwarding.

### API Contract

- **Method:** `GET`
- **Path:** `/api/v1/workspaces/{workspaceId}/search`
- **Auth:** required Clerk session.
- **Query params:**
  - `q` (required)
  - `type` (optional): `all | source | note | memory`
  - `limit` (optional): positive integer
- **Response 200:**
  - `{ data: SearchResult[] }`
- **Validation failures:**
  - invalid `type` => `400`
  - invalid `limit` => `400`

### Acceptance Criteria

- Search API supports type scoping and bounded result size.
- Invalid filter values are rejected with explicit 400 errors.
- Source results open correct source routes.
- Search UI provides quick type filters and grouped all-results view.
- Automated tests cover new validation and options forwarding.

### Definition of Done

- Search quality improvements are implemented and tested.
- Lint, typecheck, and tests pass.
- Backlog and roadmap are updated for the next sprint target.

### Artifacts

- `apps/web/lib/storage/search.ts`
- `apps/web/app/api/v1/workspaces/[workspaceId]/search/route.ts`
- `apps/web/app/search/page.tsx`
- `apps/web/lib/search/search-route.test.ts`
- `apps/web/e2e/smoke.spec.ts`
