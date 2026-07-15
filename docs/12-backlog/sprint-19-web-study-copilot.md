# Sprint 19 — Web Study Copilot Expansion (Phased)

## Product framing

Expand Aproko web from a knowledge OS into a **web study copilot** with capture + study tooling.

This does **not** replace V1 web-first scope with a FasterFlow clone. Desktop overlay, invisible system meeting capture, and detector-evasion “humanizers” stay out of scope.

### Explicitly excluded

- Desktop/mobile screen-aware overlay
- Silent OS audio / Zoom-Meet-Teams hook without user permission
- Writing tools marketed to beat Turnitin / GPTZero

### Included (web-safe)

1. Mic + file upload → transcript
2. Transcript/notes → LLM summaries, flashcards, quizzes, slide outlines
3. Stronger grounded chat + optional voice-to-text in chat
4. Legitimate rewrite/polish writing aid
5. Docs + constitution notes for desktop as V2

## Delivery sequence (must follow)

| Step | Name                                                | Status             |
| ---- | --------------------------------------------------- | ------------------ |
| 1    | Web transcript capture (mic + upload + STT)         | Done               |
| 2    | Study pipeline from transcripts (LLM)               | Done               |
| 3    | Grounded chat + memory + voice-to-text              | Done               |
| 4    | Writing polish (clarity/tone)                       | Done               |
| 5    | Constitution / architecture sync                    | Done               |
| 6    | Desktop companion design (docs only until approved) | Done (design stub) |

## Step 1 — Web transcript capture

### Goal

Authenticated users can (a) upload text/audio transcript material and (b) record microphone audio in the browser; audio is transcribed server-side and stored as workspace transcript sources.

### Requirements map

- PRD: meeting transcript upload + audio ingestion (`docs/01-prd/README.md`)
- Architecture: transcription worker path (`docs/08-rag/01-rag-pipeline.md`) — V1 web uses sync Whisper via OpenAI when `OPENAI_API_KEY` is set
- Database: reuse `sources` + storage bucket (no new table required for Step 1)
- API:
  - `GET /api/v1/workspaces/{workspaceId}/transcripts`
  - `POST /api/v1/workspaces/{workspaceId}/transcripts` (multipart: `file` or `audio`)

### Acceptance criteria

1. User can upload `.txt`, `.md`, `.vtt`, `.srt`
2. User can upload audio (e.g. `webm`, `mp3`, `wav`, `m4a`) ≤ 25MB
3. User can record from mic and submit
4. Audio returns a persisted transcript text source when STT is configured
5. List page shows new transcript sources
6. Missing `OPENAI_API_KEY` returns a clear 503 for audio STT (text upload still works)

### Artifacts

- `apps/web/lib/ai/transcription.ts`
- `apps/web/app/api/v1/workspaces/[workspaceId]/transcripts/route.ts`
- `apps/web/app/(app)/transcripts/page.tsx`
- `apps/web/lib/transcripts/api-routes.test.ts`

### Step 1 follow-up checklist

- [x] Docs updated (`sprint-19`, API, RAG note, AGENTS)
- [x] API contract matches implementation
- [x] Auth + workspace scoping
- [x] Tests for happy path + auth + config failure
- [x] UI: upload + mic record
- [x] Next step kickoff: Step 2 — LLM study pipeline from transcripts

## Step 2 — Study pipeline from transcripts (LLM)

### Goal

Users can turn note or transcript text into LLM-generated summaries, flashcards, quizzes, and slide outlines.

### API

- `POST .../summaries/generate` — `{ noteId? | sourceId?, kind?: "summary" | "outline" }`
- `POST .../flashcards/decks/{deckId}/generate` — `{ noteId? | sourceId? }`
- `POST .../quizzes/{quizId}/generate` — `{ noteId? | sourceId? }`

### Step 2 follow-up checklist

- [x] Docs updated
- [x] Shared LLM study generation module
- [x] Summaries / flashcards / quizzes accept `sourceId`
- [x] Slide outlines via `kind: "outline"`
- [x] Study UI source picker (note | transcript)
- [x] Tests pass (111)
- [x] Next: Step 3 — grounded chat + voice-to-text

## Step 3 — Grounded chat + memory + voice-to-text

### Goal

Chat answers use richer workspace grounding (search + hydrated transcript/source excerpts + memory) and the chat UI supports voice input.

### API / behavior

- Chat messages continue on `POST .../chat/sessions/{sessionId}/messages`
- `POST .../chat/voice` for Whisper STT when browser speech is unavailable
- `buildWorkspaceContext` hydrates readable source/transcript text snippets
- Memory context top-5

### Step 3 follow-up checklist

- [x] Stronger grounding + citations
- [x] Voice button (Web Speech → Whisper fallback)
- [x] Docs/API updated
- [x] Tests for context helpers + voice route
- [x] Next: Step 4 — writing polish (clarity/tone)

## Step 4 — Writing polish (clarity/tone)

### Goal

Users can polish drafts for clarity, concision, professional, or academic tone.

### Explicitly excluded

- Any mode or marketing for beating Turnitin / GPTZero / AI detectors

### API

- `POST /api/v1/workspaces/{workspaceId}/writing/polish`
- `POST /api/v1/workspaces/{workspaceId}/writing/detect` — GPTZero when `GPTZERO_API_KEY` is set; Turnitin note only (no public API)

### Step 4 follow-up checklist

- [x] Polish module + API
- [x] `/writing` page + nav + auth protect
- [x] Reject unsupported / evasion-style modes in tests
- [x] Docs updated
- [x] Next: Step 5 — constitution / architecture sync

## Step 5 — Constitution / architecture sync

### Goal

Align `AGENTS.md`, PRD, product bible, blueprint, docs hub, and system architecture with Sprint 19 shipped reality.

### Checklist

- [x] `AGENTS.md` product constraints + stack (Next.js 16, AI SDK path, Whisper)
- [x] `docs/02-architecture/PRODUCT_BLUEPRINT.md` V1 included/excluded + nav
- [x] `docs/01-prd/README.md` functional requirements + stories
- [x] `docs/README.md` scope hub
- [x] `docs/02-architecture/01-overall-system-architecture.md` topology note
- [x] `docs/00-product/APROKO_PRODUCT_BIBLE.md` surface expansion link
- [x] Next: Step 6 — desktop companion design stub

## Step 6 — Desktop companion design (docs only)

### Goal

Document V2 desktop capture companion **without implementing code**.

### Artifact

- `docs/02-architecture/03-desktop-companion-v2.md`

### Checklist

- [x] Design stub with problem, non-goals, open TODOs, entry criteria
- [x] Linked from constitution, docs hub, Sprint 19 board
- [x] Explicit: no companion binary ships under Sprint 19

## Sprint 19 closeout

Web study-copilot expansion Steps 1–6 are complete for **documentation + web features**.  
Desktop companion remains **design-only** until product owner approval.

### Follow-up: Writing detector check (transparency)

- [x] `POST .../writing/detect` with GPTZero when configured
- [x] Turnitin unavailable note (institutional portal only)
- [x] Writing page “Run detector check” UI
- [x] No rewrite-to-evade-score flow
