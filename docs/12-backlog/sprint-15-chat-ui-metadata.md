# Sprint 15 - Chat UI Metadata

## Status

- **Current ticket:** `CHAT-007`
- **State:** Done

## Ticket: CHAT-007 - Surface Persisted Chat Metadata in UI

### Product Spec

Expose the persisted chat transport/model/status metadata in the chat interface so users and operators can see the exact runtime context of each message.

### Scope

- Extend chat page client models to include session and message metadata fields.
- Populate optimistic user/assistant messages with model + transport + status metadata.
- Render message metadata line (model, transport, status) for each message.
- Keep SSE flow and citation/memory rendering behavior intact.

### Acceptance Criteria

- Chat UI displays model and transport information for persisted and optimistic messages.
- Streamed assistant messages transition from `streaming` to `completed`.
- Session contract tests include metadata fields for session payload.
- No regression in chat stream behavior.

### Definition of Done

- UI and tests updated.
- Lint, typecheck, unit tests, e2e smoke, and build pass.

### Artifacts

- `apps/web/app/chat/page.tsx`
- `apps/web/lib/chat/api-routes.test.ts`
