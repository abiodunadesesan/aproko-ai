# Sprint 13 - Chat Persistence Alignment

## Status

- **Current ticket:** `CHAT-006`
- **State:** Done

## Ticket: CHAT-006 - Persist Stream and Model Metadata

### Product Spec

Align runtime chat persistence with the finalized V1 schema so each message/session carries model and transport metadata for auditability and downstream analytics.

### Scope

- Extend chat session model with `modelProvider`, `modelName`, and `lastMessageAt`.
- Extend chat message model with `responseTransport`, `modelProvider`, `modelName`, `status`, and `metadata`.
- Persist selected model and transport metadata when user/assistant messages are created.
- Touch conversation row with `last_message_at` and latest model metadata.
- Expose the new metadata through session/message API payloads.

### API Contract

- `GET /api/v1/workspaces/{workspaceId}/chat/sessions`
  - includes `modelProvider`, `modelName`, `lastMessageAt`.
- `GET /api/v1/workspaces/{workspaceId}/chat/sessions/{sessionId}/messages`
  - includes message `responseTransport`, `modelProvider`, `modelName`, `status`, `metadata`.
- `POST /api/v1/workspaces/{workspaceId}/chat/sessions/{sessionId}/messages`
  - persists metadata for both user and assistant turns.

### Acceptance Criteria

- Message persistence writes model and transport metadata for each turn.
- Conversation persistence tracks latest model and last message timestamp.
- Session/message routes return enriched payloads without breaking existing clients.
- Unit tests cover updated contract.

### Definition of Done

- Storage layer aligned with migration columns.
- Route handlers updated for enriched payloads.
- Contract tests pass.
- Lint, typecheck, unit tests, e2e smoke, and build pass.

### Artifacts

- `apps/web/lib/storage/chat.ts`
- `apps/web/app/api/v1/workspaces/[workspaceId]/chat/sessions/route.ts`
- `apps/web/app/api/v1/workspaces/[workspaceId]/chat/sessions/[sessionId]/messages/route.ts`
- `apps/web/lib/chat/api-routes.test.ts`
