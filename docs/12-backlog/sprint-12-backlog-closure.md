# Sprint 12 - Backlog Closure

## Status

- **Current ticket:** `CORE-001`
- **State:** Done

## Ticket: CORE-001 - Resolve Remaining Core TODOs

### Product Spec

Close the remaining unresolved TODOs across AI Core and Memory so the sprint backlog reaches a stable "implemented" state.

### Scope

- Finalize memory lifecycle schema contract (`state`, `confidence_score`, `last_referenced_at`).
- Expose lifecycle fields in memory API and memory timeline UI.
- Add API validation for lifecycle inputs.
- Finalize chat streaming transport contract as explicit SSE with event ids and transport header.
- Add Supabase migration for memory/chat contract fields.

### API Contract

- `GET /api/v1/workspaces/{workspaceId}/memory/items`
  - response includes `state`, `confidenceScore`, `lastReferencedAt`.
- `POST /api/v1/workspaces/{workspaceId}/memory/items`
  - accepts optional `state`, `confidenceScore`.
  - validates range and enum.
- `POST /api/v1/workspaces/{workspaceId}/chat/sessions/{sessionId}/messages`
  - SSE stream includes `id:` frame line and transport metadata.
  - response header `X-Aproko-Stream-Transport: sse`.

### Acceptance Criteria

- Memory lifecycle columns are represented in migration and runtime payloads.
- Memory create endpoint validates `confidenceScore` and `state`.
- Memory ranking factors lifecycle signals.
- Chat stream contract is explicit and test-covered.
- Remaining sprint TODO notes for Sprint 3 and Sprint 4 are cleared.

### Definition of Done

- Runtime code and tests updated.
- Migration added.
- Backlog docs updated to reflect closure of the TODOs.
- Lint, typecheck, unit tests, e2e smoke, and build pass.

### Artifacts

- `supabase/migrations/202606300003_memory_chat_contracts.sql`
- `apps/web/lib/storage/memory.ts`
- `apps/web/app/api/v1/workspaces/[workspaceId]/memory/items/route.ts`
- `apps/web/lib/memory/api-routes.test.ts`
- `apps/web/lib/memory/embed-route.test.ts`
- `apps/web/app/memory/page.tsx`
- `apps/web/app/api/v1/workspaces/[workspaceId]/chat/sessions/[sessionId]/messages/route.ts`
- `apps/web/lib/chat/api-routes.test.ts`
- `docs/12-backlog/sprint-03-ai-core.md`
- `docs/12-backlog/sprint-04-memory.md`
