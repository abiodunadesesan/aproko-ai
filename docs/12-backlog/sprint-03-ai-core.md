# Sprint 03 - AI Core

## Sprint Goal

Ship the first usable AI core experience that turns the workspace into an interactive, source-aware chat product.

## Scope

- AI workspace chat
- Prompt orchestration baseline
- Streaming response baseline
- Citation-ready response contract

## Tickets

### CHAT-001 - AI Workspace Chat

- **Epic**: Epic 3 - AI Core
- **Status**: Done
- **Product Specification**: Authenticated users can ask questions in a workspace chat and receive streaming assistant responses grounded in selected workspace context.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (AI Chat, Library, Document Viewer)
- **Database Changes**:
  - Ensure conversation/message persistence contracts are active (`conversations`, `messages`, citation linkage placeholder).
  - Minimal V1 persistence fields finalized in Sprint 12 (`model_provider`, `model_name`, `response_transport`, `status`, `metadata`, `last_message_at`).
- **API Contract**:
  - `POST /api/v1/workspaces/{workspaceId}/chat/sessions`
  - `GET /api/v1/workspaces/{workspaceId}/chat/sessions`
  - `POST /api/v1/workspaces/{workspaceId}/chat/sessions/{sessionId}/messages` (streaming)
  - Streaming contract finalized as SSE with event ids + explicit transport header in Sprint 12.
- **Acceptance Criteria**:
  1. User can open a chat workspace and send a message.
  2. Assistant response streams incrementally in the UI.
  3. Chat session persists and can be reopened.
  4. Context mode is visible (`workspace` baseline at minimum).
  5. Route protection and workspace scoping are enforced.
- **Definition of Done**:
  - Chat page baseline integrated into app shell navigation.
  - Session/message API routes implemented with auth + workspace checks.
  - Streaming path implemented and manually verified.
  - Backlog ticket status/artifacts updated.
- **Tests**:
  - Chat route auth guard test.
  - Session create/list contract tests.
  - Streaming message endpoint smoke test.
- **Dependencies**:
  - AUTH-001
  - AUTH-002
  - LIB-001
- **Artifacts**:
  - `apps/web/app/chat/page.tsx`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/chat/sessions/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/chat/sessions/[sessionId]/messages/route.ts`
  - `apps/web/lib/storage/chat.ts`
  - `apps/web/lib/chat/api-routes.test.ts`

### CHAT-002 - Streaming Responses

- **Epic**: Epic 3 - AI Core
- **Status**: Done
- **Product Specification**: Chat responses stream incrementally with a stable transport contract and explicit completion/error events.
- **API Contract**:
  - `POST /api/v1/workspaces/{workspaceId}/chat/sessions/{sessionId}/messages`
  - SSE events: `start`, `delta`, `done`, `error`
- **Acceptance Criteria**:
  1. Streaming response emits structured event frames.
  2. Client parser handles chunk boundary splits safely.
  3. UI detects missing completion and surfaces streaming errors.
- **Definition of Done**:
  - Server emits typed SSE frames with explicit completion marker.
  - Chat page parser consumes event frames using buffered parsing.
  - Tests cover stream event shape and empty content validation.
- **Artifacts**:
  - `apps/web/app/api/v1/workspaces/[workspaceId]/chat/sessions/[sessionId]/messages/route.ts`
  - `apps/web/app/chat/page.tsx`
  - `apps/web/lib/chat/api-routes.test.ts`

### CHAT-003 - Conversation History

- **Epic**: Epic 3 - AI Core
- **Status**: Done
- **Product Specification**: Users can reopen previous sessions reliably and retrieve complete message history inside the same workspace scope.
- **Acceptance Criteria**:
  1. Chat page restores the last opened session when user returns.
  2. URL query state can reopen a specific session (`/chat?session=...`).
  3. Invalid session ids gracefully fall back to the latest available session.
  4. Session history API contract is covered with success and not-found tests.
- **Definition of Done**:
  - Active session is synced to URL and persisted in local storage.
  - History loading uses guarded selection logic for stale/missing sessions.
  - Message GET route behavior is tested for 200 and 404 paths.
- **Artifacts**:
  - `apps/web/app/chat/page.tsx`
  - `apps/web/lib/chat/api-routes.test.ts`
  - `apps/web/lib/storage/chat.ts`

### CHAT-004 - Citations

- **Epic**: Epic 3 - AI Core
- **Status**: Done
- **Product Specification**: Assistant responses expose citation metadata in the streaming contract and render references inline in chat.
- **API Contract**:
  - `POST /api/v1/workspaces/{workspaceId}/chat/sessions/{sessionId}/messages`
  - `done` SSE payload includes `citations[]` with `{ id, title, snippet, sourceType }`
- **Acceptance Criteria**:
  1. Streaming completion event includes citation payload.
  2. Chat UI renders citation cards under assistant messages.
  3. Citation contract is covered by API tests.
- **Definition of Done**:
  - Server emits citations in `done` event payload.
  - Client parser maps citation payload to assistant message UI.
  - Tests assert citation fields in stream response.
- **Artifacts**:
  - `apps/web/app/api/v1/workspaces/[workspaceId]/chat/sessions/[sessionId]/messages/route.ts`
  - `apps/web/app/chat/page.tsx`
  - `apps/web/lib/chat/api-routes.test.ts`

### CHAT-005 - Multi-model Routing

- **Epic**: Epic 3 - AI Core
- **Status**: Done
- **Product Specification**: Chat supports baseline model selection so users can route prompts through different providers while keeping workspace scope and streaming behavior.
- **API Contract**:
  - `POST /api/v1/workspaces/{workspaceId}/chat/sessions/{sessionId}/messages`
  - Request payload accepts `model`
  - Stream `start` and `done` events include selected `model`
- **Acceptance Criteria**:
  1. User can choose a model before sending a message.
  2. API validates model choices and rejects unsupported options.
  3. Stream metadata and UI both reflect the routed model.
- **Definition of Done**:
  - Chat UI exposes model selector and sends model in request.
  - Server validates and emits model in SSE metadata.
  - Tests cover supported model stream and unsupported model validation.
- **Artifacts**:
  - `apps/web/app/chat/page.tsx`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/chat/sessions/[sessionId]/messages/route.ts`
  - `apps/web/lib/chat/api-routes.test.ts`

## Sprint 03 Exit Snapshot

- CHAT-001: Done
- CHAT-002: Done
- CHAT-003: Done
- CHAT-004: Done
- CHAT-005: Done
