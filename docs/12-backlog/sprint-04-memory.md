# Sprint 04 - Memory

## Sprint Goal

Establish the first production-ready memory layer so workspace knowledge can be persisted and surfaced beyond chat transcripts.

## Scope

- Memory item persistence baseline
- Timeline-oriented memory UI baseline
- API contract for memory ingestion and listing

## Tickets

### MEM-001 - Memory Items Baseline

- **Epic**: Epic 4 - Memory
- **Status**: Done
- **Product Specification**: Workspace users can capture typed memory items and view recent memory timeline entries in the web app.
- **Database Changes**:
  - Reuse `memory_items` contract (`workspace_id`, `memory_type`, `content`, `importance_score`, timestamps).
  - `TODO`: finalize lifecycle columns (`state`, `confidence_score`, `last_referenced_at`) in migration phase.
- **API Contract**:
  - `GET /api/v1/workspaces/{workspaceId}/memory/items`
  - `POST /api/v1/workspaces/{workspaceId}/memory/items`
- **Acceptance Criteria**:
  1. Authenticated user can open Memory page in app shell.
  2. User can create a memory item with `memoryType`, `summary`, and optional importance score.
  3. User can list recent memory items for current workspace.
  4. API validates memory type and score bounds.
- **Definition of Done**:
  - Memory page baseline delivered and protected.
  - Memory storage module and route handlers added.
  - Route contract tests added for auth/validation/success.
- **Tests**:
  - Memory route auth guard test.
  - Memory create validation tests.
  - Memory list success test.
- **Artifacts**:
  - `apps/web/app/memory/page.tsx`
  - `apps/web/lib/storage/memory.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/memory/items/route.ts`
  - `apps/web/lib/memory/api-routes.test.ts`
  - `apps/web/components/app-shell.tsx`
  - `apps/web/middleware.ts`

### MEM-002 - Embedding Pipeline Integration

- **Status**: Done
- **Product Specification**: Eligible memory items can be queued for embeddings so downstream vector indexing workers can process them asynchronously.
- **API Contract**:
  - `POST /api/v1/workspaces/{workspaceId}/memory/items/{memoryItemId}/embed`
  - request accepts optional `model`
  - response returns updated memory item with `embeddingJob` metadata
- **Acceptance Criteria**:
  1. User can trigger embedding queue action from Memory UI.
  2. API validates auth and memory item existence.
  3. Memory item embedding metadata is persisted with status `queued`.
- **Definition of Done**:
  - Embedding queue route handler added with dependency-injected tests.
  - Storage layer supports queueing embedding metadata per memory item.
  - Memory UI shows embedding status and queue action.
- **Artifacts**:
  - `apps/web/app/api/v1/workspaces/[workspaceId]/memory/items/[memoryItemId]/embed/route.ts`
  - `apps/web/lib/storage/memory.ts`
  - `apps/web/app/memory/page.tsx`
  - `apps/web/lib/memory/embed-route.test.ts`

### MEM-003 - Timeline Ranking

- **Status**: Done
- **Product Specification**: Memory timeline returns ranked entries using recency, importance, and activity/embedding signals so users see high-value memories first.
- **API Contract**:
  - `GET /api/v1/workspaces/{workspaceId}/memory/items?sort=ranked`
  - response includes `rankScore` per item
- **Acceptance Criteria**:
  1. Ranked mode is available for memory item listing.
  2. Rank score combines recency, importance, and activity/embedding status.
  3. Memory UI shows ranking value and consumes ranked mode.
- **Definition of Done**:
  - Ranking function implemented and exercised in route tests.
  - API payload includes `rankScore`.
  - Memory page requests ranked mode and surfaces score.
- **Artifacts**:
  - `apps/web/app/api/v1/workspaces/[workspaceId]/memory/items/route.ts`
  - `apps/web/lib/memory/api-routes.test.ts`
  - `apps/web/app/memory/page.tsx`

### MEM-004 - Related Memory/Document Linking

- **Status**: Done
- **Product Specification**: Memory records can carry source/message/memory references and timeline responses surface related memory suggestions.
- **API Contract**:
  - `POST /api/v1/workspaces/{workspaceId}/memory/items` accepts:
    - `sourceIds[]`
    - `messageIds[]`
    - `relatedMemoryIds[]`
  - `GET /api/v1/workspaces/{workspaceId}/memory/items?sort=ranked` returns:
    - `references`
    - `relatedItems[]` with score + reason
- **Acceptance Criteria**:
  1. User can attach references during memory creation.
  2. API persists and returns references.
  3. Timeline surfaces related memories based on links and shared signals.
- **Definition of Done**:
  - Memory storage supports normalized references.
  - Memory list route computes related items and includes in payload.
  - Memory UI displays reference counts and related suggestions.
- **Artifacts**:
  - `apps/web/lib/storage/memory.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/memory/items/route.ts`
  - `apps/web/app/memory/page.tsx`
  - `apps/web/lib/memory/api-routes.test.ts`

### MEM-005 - Workspace Memory Retrieval in Chat

- **Status**: Done
- **Product Specification**: Chat responses should include top-ranked workspace memory context so assistant generation is informed by durable memory.
- **API Contract**:
  - `POST /api/v1/workspaces/{workspaceId}/chat/sessions/{sessionId}/messages`
  - SSE `start`/`done` events include `memoryContext[]`
    - `{ memoryItemId, memoryType, summary, rankScore }`
- **Acceptance Criteria**:
  1. Chat backend retrieves ranked workspace memory context before assistant response assembly.
  2. Stream payload carries selected memory context metadata.
  3. Chat UI renders memory context used for the assistant turn.
- **Definition of Done**:
  - Chat route dependencies include memory retrieval.
  - Assistant response path injects memory context into stream contract.
  - Chat contract tests validate memory context payload presence.
- **Artifacts**:
  - `apps/web/app/api/v1/workspaces/[workspaceId]/chat/sessions/[sessionId]/messages/route.ts`
  - `apps/web/app/chat/page.tsx`
  - `apps/web/lib/chat/api-routes.test.ts`

## Sprint 04 Exit Snapshot

- MEM-001: Done
- MEM-002: Done
- MEM-003: Done
- MEM-004: Done
- MEM-005: Done
