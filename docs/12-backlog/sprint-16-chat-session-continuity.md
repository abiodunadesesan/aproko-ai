# Sprint 16 - Chat Session Continuity

## Status

- **Current ticket:** `CHAT-008`
- **State:** Done

## Ticket: CHAT-008 - Session Metadata Continuity in Chat UI

### Product Spec

Improve session continuity by surfacing persisted session model and last activity metadata directly in the chat session list and active session header.

### Scope

- Display session-level model metadata in the sidebar list.
- Display last activity using `lastMessageAt` fallback to `updatedAt`.
- Show active session model in chat header.
- Auto-sync model selector from active session metadata when available.

### Acceptance Criteria

- Session list shows model info and accurate last activity time.
- Active session header shows the session model.
- Selecting a session with persisted model updates the model selector.
- Existing chat streaming and message rendering behavior remains unchanged.

### Definition of Done

- UI updates implemented in `chat/page.tsx`.
- Lint, typecheck, unit tests, e2e smoke, and build pass.

### Artifacts

- `apps/web/app/chat/page.tsx`
