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

- `GET /v1/workspaces/current` — resolve (or create) the signed-in user's personal workspace
- `GET /v1/workspaces`
- `POST /v1/workspaces`
- `GET /v1/workspaces/{workspace_id}`
- `PATCH /v1/workspaces/{workspace_id}`
- `DELETE /v1/workspaces/{workspace_id}` (soft delete)

Protected workspace-scoped routes require membership in `workspace_memberships` for the authenticated Clerk user (403 otherwise).

### Library Sources and Uploads

Allowed source formats in V1: PDF, DOCX, PPTX, TXT, Markdown, image, audio.

- `POST /v1/workspaces/{workspace_id}/sources`
- `GET /v1/workspaces/{workspace_id}/sources`
- `GET /v1/workspaces/{workspace_id}/sources/{source_id}`
- `PATCH /v1/workspaces/{workspace_id}/sources/{source_id}`
- `DELETE /v1/workspaces/{workspace_id}/sources/{source_id}`
- `POST /v1/workspaces/{workspace_id}/sources/{source_id}/reprocess`

Upload (`POST`) persists the file to Supabase Storage, writes `sources` metadata, and **sync-ingests** text-based PDFs, DOCX, and text files into `source_chunks` for search and chat grounding (≤ 12MB, web sync MVP). Response includes `{ source, ingest }`. Ingest failures do not fail the upload response.

`POST .../reprocess` re-runs extract → chunk → embed for an existing source (Sprint 22).

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

### Live browser context (Sprint 29 / V2 companion)

- `POST /v1/workspaces/{workspace_id}/live-context/chat` — streaming SSE assistant grounded in extension-captured tab context
  - Body: `{ url, title, pageText | fullPageContext, activeHoverContext?, capturedAt?, userQuery, model? }`
  - `activeHoverContext` is cursor-focus text (highest priority in the system prompt)
  - Auth: Clerk session (cookies or Bearer) + workspace membership
  - Consumes AI query quota; CORS allowlist includes `chrome-extension://*` and `APROKO_EXTENSION_ORIGIN_ALLOWLIST`
  - Does **not** persist captures as library sources in MVP
- `POST /v1/workspaces/{workspace_id}/live-context/solve` — JSON solve helper for Alt/Option-click on a question
  - Body same as chat (`pageText`/`fullPageContext`, `activeHoverContext`, `userQuery?`)
  - Response: `{ data: { kind, optionKey, optionText, fillText, explanation, model } }`
  - Used by the extension to highlight MCQ options or fill nearby text fields

### Search

- `GET /v1/workspaces/{workspace_id}/search?q=...`
- Hybrid lexical + semantic chunk retrieval when `QDRANT_URL` and `OPENAI_API_KEY` are configured (Sprint 23). Falls back to ILIKE-only otherwise.
- `POST /v1/workspaces/{workspace_id}/search/semantic` — deferred; semantic leg is merged into `GET /search`.

### Notes

- `GET /v1/workspaces/{workspace_id}/notes`
- `POST /v1/workspaces/{workspace_id}/notes`
- `PATCH /v1/workspaces/{workspace_id}/notes/{note_id}`
- `DELETE /v1/workspaces/{workspace_id}/notes/{note_id}`

### Flashcards

- `POST /v1/workspaces/{workspace_id}/flashcards/decks`
- `GET /v1/workspaces/{workspace_id}/flashcards/decks`
- `POST /v1/workspaces/{workspace_id}/flashcards/decks/{deck_id}/generate` — body `{ noteId? | sourceId? }`
- `POST /v1/workspaces/{workspace_id}/flashcards/reviews`

### Quizzes

- `POST /v1/workspaces/{workspace_id}/quizzes`
- `GET /v1/workspaces/{workspace_id}/quizzes`
- `POST /v1/workspaces/{workspace_id}/quizzes/{quiz_id}/generate` — body `{ noteId? | sourceId? }`
- `POST /v1/workspaces/{workspace_id}/quizzes/{quiz_id}/attempts`
- `POST /v1/workspaces/{workspace_id}/quizzes/{quiz_id}/attempts/{attempt_id}/submit`

### Meetings and Summaries

- `GET /api/v1/workspaces/{workspace_id}/transcripts` — list transcript/audio sources
- `POST /api/v1/workspaces/{workspace_id}/transcripts` — multipart `file`/`audio`; text stored directly; audio transcribed via Whisper when `OPENAI_API_KEY` is set
- `POST /api/v1/workspaces/{workspace_id}/writing/polish` — `{ text, mode: "clarity"|"concise"|"professional"|"academic" }` → polished draft (clarity/tone only; not detector evasion)
- `POST /api/v1/workspaces/{workspace_id}/writing/detect` — `{ text, source?: "draft"|"polished" }` → transparency report (`gptzero` live when `GPTZERO_API_KEY` is set; `turnitin` always returns unavailable + institution-portal guidance)
- `GET /api/v1/workspaces/{workspace_id}/writing/drafts` — list current user's writing drafts (scoped by Clerk user)
- `POST /api/v1/workspaces/{workspace_id}/writing/drafts` — `{ title?, draft?, polished?, mode? }` → create draft
- `GET|PATCH|DELETE /api/v1/workspaces/{workspace_id}/writing/drafts/{draft_id}` — read / update / delete a draft
- `POST /api/v1/workspaces/{workspace_id}/summaries/generate` — `{ noteId? | sourceId?, kind?: "summary" | "outline" }`
- Chat grounding hydrates transcript/source text excerpts into prompts + citations (`note` | `transcript` | `workspace-source` | `memory`)
- `POST /api/v1/workspaces/{workspace_id}/chat/voice` — multipart audio → `{ data: { text } }` for chat voice-to-text (Whisper; Web Speech preferred in UI when available)
- `POST /v1/workspaces/{workspace_id}/meetings/transcripts` — legacy contract alias (prefer `/transcripts`)
- `GET /v1/workspaces/{workspace_id}/meetings`
- `POST /v1/workspaces/{workspace_id}/summaries`

### Timeline and Memory

- `GET /v1/workspaces/{workspace_id}/timeline`
- `GET /v1/workspaces/{workspace_id}/memory`
- `POST /v1/workspaces/{workspace_id}/memory/rebuild`

### Settings and Billing

- `GET /v1/me` — profile + `preferences` (`defaultChatModel`, `autoMemoryCapture`)
- `PATCH /v1/me` — `{ full_name? }` and/or `{ preferences?: { defaultChatModel, autoMemoryCapture } }`
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
