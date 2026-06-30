# Sprint 17 - Chat Session Management

## Status

- **Current ticket:** `CHAT-009`
- **State:** Done

## Ticket: CHAT-009 - Rename and Delete Chat Sessions

### Product Spec

Users can manage chat sessions directly from the chat sidebar, including renaming sessions and deleting obsolete threads.

### Scope

- Add session-level `PATCH` and `DELETE` API route for chat sessions.
- Add storage helpers for session title update and deletion.
- Add route contract tests for rename and delete success paths.
- Add sidebar actions in chat UI for `Rename` and `Delete`.

### API Contract

- `PATCH /api/v1/workspaces/{workspaceId}/chat/sessions/{sessionId}`
  - request: `{ title: string }`
  - response: `{ data: ChatSession }`
- `DELETE /api/v1/workspaces/{workspaceId}/chat/sessions/{sessionId}`
  - response: `{ ok: true }`

### Acceptance Criteria

- User can rename a session and see title updated immediately after refresh.
- User can delete a session and list/selection state stays consistent.
- Auth and not-found checks are enforced in route handlers.
- Existing chat flow remains stable.

### Definition of Done

- API + storage + UI implemented.
- Unit tests updated for route handlers.
- Lint, typecheck, unit tests, e2e smoke, and build pass.

### Artifacts

- `apps/web/app/api/v1/workspaces/[workspaceId]/chat/sessions/[sessionId]/route.ts`
- `apps/web/lib/storage/chat.ts`
- `apps/web/lib/chat/api-routes.test.ts`
- `apps/web/app/chat/page.tsx`
