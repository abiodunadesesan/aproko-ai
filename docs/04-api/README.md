# 04 - API Design (REST)

## API Principles

- Base path: `/v1`
- JSON-only request/response
- Consistent error envelope
- JWT auth required except public/auth bootstraps
- Cursor pagination for list endpoints
- Idempotency for retry-sensitive create operations

## Authentication

- Clerk session/JWT in `Authorization: Bearer <token>` or Clerk middleware context
- Backend verifies Clerk identity and membership per workspace
- Admin endpoints require elevated role

## Error Handling Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "file_type"
    },
    "request_id": "req_123"
  }
}
```

## Common Error Codes

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `RATE_LIMITED`
- `CONFLICT`
- `PROCESSING_FAILED`
- `INTERNAL_ERROR`

## Rate Limiting

- Sliding-window limits by user + workspace + endpoint class
- stricter limits on generation-heavy endpoints
- return headers:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

`TODO`: Final per-plan and per-endpoint limits.

## Pagination

Request:
- `?cursor=<opaque>&limit=20`

Response:
```json
{
  "data": [],
  "page": {
    "next_cursor": "opaque_cursor",
    "has_more": true
  }
}
```

## Endpoint Catalog

### Health and System
- `GET /v1/health`
- `GET /v1/version`

### Auth (Clerk-backed)
- Auth UI and OAuth flows are handled by Clerk-hosted components/routes.
- Backend verifies Clerk session/JWT on protected requests.
- Optional sync endpoint for profile hydration:
  - `POST /v1/auth/session/sync`

### Workspaces
- `GET /v1/workspaces`
- `POST /v1/workspaces`
- `GET /v1/workspaces/{workspace_id}`
- `PATCH /v1/workspaces/{workspace_id}`
- `DELETE /v1/workspaces/{workspace_id}` (soft delete)

### Library Sources and Uploads

Allowed source formats in V1: PDF, DOCX, PPTX, TXT, Markdown, image, audio.

- `POST /v1/workspaces/{workspace_id}/sources/upload-url`
- `POST /v1/workspaces/{workspace_id}/sources`
- `GET /v1/workspaces/{workspace_id}/sources`
- `GET /v1/workspaces/{workspace_id}/sources/{source_id}`
- `PATCH /v1/workspaces/{workspace_id}/sources/{source_id}`
- `DELETE /v1/workspaces/{workspace_id}/sources/{source_id}`
- `POST /v1/workspaces/{workspace_id}/sources/{source_id}/reprocess`

### Projects and Folders
- `GET /v1/workspaces/{workspace_id}/projects`
- `POST /v1/workspaces/{workspace_id}/projects`
- `GET /v1/workspaces/{workspace_id}/projects/{project_id}`
- `PATCH /v1/workspaces/{workspace_id}/projects/{project_id}`
- `DELETE /v1/workspaces/{workspace_id}/projects/{project_id}`
- `GET /v1/workspaces/{workspace_id}/projects/{project_id}/folders`
- `POST /v1/workspaces/{workspace_id}/projects/{project_id}/folders`
- `GET /v1/workspaces/{workspace_id}/folders/{folder_id}`
- `PATCH /v1/workspaces/{workspace_id}/folders/{folder_id}`
- `DELETE /v1/workspaces/{workspace_id}/folders/{folder_id}`

### Chat
- `POST /v1/workspaces/{workspace_id}/chat/sessions`
- `GET /v1/workspaces/{workspace_id}/chat/sessions`
- `GET /v1/workspaces/{workspace_id}/chat/sessions/{session_id}`
- `POST /v1/workspaces/{workspace_id}/chat/sessions/{session_id}/messages`

### Search
- `GET /v1/workspaces/{workspace_id}/search?q=...`
- `POST /v1/workspaces/{workspace_id}/search/semantic`

### Notes
- `GET /v1/workspaces/{workspace_id}/notes`
- `POST /v1/workspaces/{workspace_id}/notes`
- `PATCH /v1/workspaces/{workspace_id}/notes/{note_id}`
- `DELETE /v1/workspaces/{workspace_id}/notes/{note_id}`

### Flashcards
- `POST /v1/workspaces/{workspace_id}/flashcards/decks`
- `GET /v1/workspaces/{workspace_id}/flashcards/decks`
- `POST /v1/workspaces/{workspace_id}/flashcards/decks/{deck_id}/generate`
- `POST /v1/workspaces/{workspace_id}/flashcards/reviews`

### Quizzes
- `POST /v1/workspaces/{workspace_id}/quizzes`
- `GET /v1/workspaces/{workspace_id}/quizzes`
- `POST /v1/workspaces/{workspace_id}/quizzes/{quiz_id}/attempts`
- `POST /v1/workspaces/{workspace_id}/quizzes/{quiz_id}/attempts/{attempt_id}/submit`

### Meetings and Summaries
- `POST /v1/workspaces/{workspace_id}/meetings/transcripts`
- `GET /v1/workspaces/{workspace_id}/meetings`
- `POST /v1/workspaces/{workspace_id}/summaries`

### Timeline and Memory
- `GET /v1/workspaces/{workspace_id}/timeline`
- `GET /v1/workspaces/{workspace_id}/memory`
- `POST /v1/workspaces/{workspace_id}/memory/rebuild`

### Settings and Billing
- `GET /v1/me`
- `PATCH /v1/me/settings`
- `GET /v1/billing/subscription`
- `POST /v1/billing/checkout`
- `POST /v1/billing/webhooks`

### Admin
- `GET /v1/admin/users`
- `GET /v1/admin/workspaces`
- `GET /v1/admin/usage`

## Sample Request/Response

### Create Workspace
`POST /v1/workspaces`

Request:
```json
{ "name": "Research Lab" }
```

Response `201`:
```json
{
  "id": "ws_123",
  "name": "Research Lab",
  "slug": "research-lab",
  "created_at": "2026-06-29T00:00:00Z"
}
```

## Validation Rules

- Strict schema validation (Pydantic)
- file type and size checks before processing
- sanitization of rich text and metadata fields
- enum-based status fields

`TODO`: Final max file size and per-type upload constraints.

## Cross References

- Database schema: `../03-database/README.md`
- Memory/RAG behavior: `../07-ai-memory/README.md`, `../08-rag/README.md`
- Deployment + rate-limit enforcement: `../11-deployment/README.md`
