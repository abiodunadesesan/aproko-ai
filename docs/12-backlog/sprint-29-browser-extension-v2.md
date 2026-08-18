# Sprint 29 — Browser Extension Live Context (V2)

Status: **In progress / MVP shipped in repo** — product owner approved 2026-08-16  
Architecture: `docs/02-architecture/04-browser-extension-companion-v2.md`  
Source prompt: `docs/12-backlog/inputs/cursor_prompt-screen-live-context.md`  
Package: `apps/extension/extension`  
Constitution: `AGENTS.md` §1 (V2 companion)

## Goal

Ship a Chrome MV3 extension + web API path so users can ask Aproko about the
**active browser tab** (text + metadata) via shortcut / side panel, without
leaving the browsing flow.

## Out of scope (still V2 desktop)

- OS screen overlay over arbitrary desktop windows
- Invisible meeting audio capture
- Native mobile apps

## Product specification

| ID | Requirement | Status |
| --- | --- | --- |
| BE-1 | Toggle side panel / overlay with `Ctrl/Cmd+Shift+Y` | Done |
| BE-2 | Extension extracts visible page text + title + URL on demand | Done |
| BE-3 | Context posts to authenticated Aproko `/api/v1` live-context chat | Done |
| BE-4 | Streaming assistant response grounded in captured context | Done |
| BE-5 | Web app shows live-context dashboard + connect checklist | Done |
| BE-6 | Capture requires explicit user action | Done |
| BE-7 | Cursor focus structured UI + page topic summary | Done |
| BE-8 | Safari Web Extension package (popup UI) | Done |
| BE-9 | `Ctrl/Cmd+Shift+H` captures text under the cursor | Done |
| BE-10 | Side panel Live Transcript streams page + hover text | Done |

## UX specification

- Extension: side panel + Shadow DOM “Ask Aproko” chip
- Web: `/extension/live`, `/extension/connect` under app shell (“Live context” nav)

## Database changes

None for MVP — context is ephemeral request payload only.

## API contract

`POST /api/v1/workspaces/{workspace_id}/live-context/chat`

```json
{
  "url": "https://example.com/doc",
  "title": "Example Doc",
  "pageText": "...",
  "capturedAt": "2026-08-16T08:00:00.000Z",
  "userQuery": "Summarize the key claims",
  "model": "openai:gpt-4o-mini"
}
```

SSE events: `start` | `delta` | `done` | `error` (see `docs/04-api/README.md`).

## Acceptance criteria

- [x] Extension loads unpacked from `apps/extension/extension`
- [x] Shortcut captures active tab and opens side panel with context preview
- [x] Authenticated streaming reply uses page context in the system prompt
- [x] CORS helpers allow `chrome-extension://` preflight
- [x] Usage counted via `consumeAiQueryQuota`
- [ ] Store / production privacy review before public listing
- [ ] Manual smoke on staging host with production cookies

## Definition of Done (MVP)

- Architecture + API docs updated
- Unit tests for sanitize + live-context route
- Extension README with load-unpacked steps
- Privacy review for store release (remaining)

## Test plan

1. Load unpacked extension; verify permissions and command
2. Capture a long article; confirm truncation
3. Signed-out request → 401 / friendly side-panel error
4. Workspace isolation via existing membership checks
5. Unit: `pnpm --filter @aproko/web test` (live-context suites)

## Dependencies

- Existing chat streaming + Clerk session cookies
- AI provider keys on web server
- Host permissions for target web origin

## Implementation phases

1. ~~Scaffold extension~~
2. ~~Live-context chat route + system prompt~~
3. ~~Side panel → API with cookie auth~~
4. ~~Web UI: connect + live dashboard~~
5. Packaging / store listing (next)
