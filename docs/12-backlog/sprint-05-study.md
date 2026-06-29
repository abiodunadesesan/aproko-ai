# Sprint 05 - Study

## Sprint Goal

Transform captured and retrieved knowledge into structured learning outputs (notes, flashcards, quizzes, and summaries).

## Scope

- Notes baseline
- Flashcards baseline
- Quiz baseline
- AI study summaries

## Tickets

### NOTE-001 - Notes Baseline

- **Status**: Done
- **Product Specification**: Users can create, edit, view, search, and delete workspace notes from the Study workspace using protected app routes.
- **API Contract**:
  - `GET /api/v1/workspaces/{workspaceId}/notes`
  - `POST /api/v1/workspaces/{workspaceId}/notes`
  - `GET /api/v1/workspaces/{workspaceId}/notes/{noteId}`
  - `PATCH /api/v1/workspaces/{workspaceId}/notes/{noteId}`
  - `DELETE /api/v1/workspaces/{workspaceId}/notes/{noteId}`
- **Acceptance Criteria**:
  1. Study page lists notes and allows searching by title/content.
  2. User can create and select a note.
  3. User can edit and save note title/content.
  4. User can delete notes.
  5. Study route and notes APIs are auth-protected.
- **Definition of Done**:
  - Notes storage module implemented.
  - Notes API routes implemented with dependency-injected handlers.
  - Study page editor/list UI implemented in app shell.
  - Notes route contract tests added and passing.
- **Artifacts**:
  - `apps/web/lib/storage/notes.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/notes/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/notes/[noteId]/route.ts`
  - `apps/web/app/study/page.tsx`
  - `apps/web/lib/study/notes-api-routes.test.ts`
  - `apps/web/components/app-shell.tsx`
  - `apps/web/middleware.ts`

### FLASH-001 - Flashcards Baseline

- **Status**: Done
- **Product Specification**: Users can create decks, add flashcards manually, and generate flashcards from note content inside the Study workspace.
- **API Contract**:
  - `GET /api/v1/workspaces/{workspaceId}/flashcards/decks`
  - `POST /api/v1/workspaces/{workspaceId}/flashcards/decks`
  - `GET /api/v1/workspaces/{workspaceId}/flashcards/decks/{deckId}`
  - `PATCH /api/v1/workspaces/{workspaceId}/flashcards/decks/{deckId}`
  - `DELETE /api/v1/workspaces/{workspaceId}/flashcards/decks/{deckId}`
  - `GET /api/v1/workspaces/{workspaceId}/flashcards/decks/{deckId}/cards`
  - `POST /api/v1/workspaces/{workspaceId}/flashcards/decks/{deckId}/cards`
  - `PATCH /api/v1/workspaces/{workspaceId}/flashcards/decks/{deckId}/cards/{cardId}`
  - `DELETE /api/v1/workspaces/{workspaceId}/flashcards/decks/{deckId}/cards/{cardId}`
  - `POST /api/v1/workspaces/{workspaceId}/flashcards/decks/{deckId}/generate`
- **Acceptance Criteria**:
  1. Study page allows creating and selecting flashcard decks.
  2. User can add flashcards manually to the selected deck.
  3. User can generate baseline flashcards from an active note.
  4. User can view generated and manual flashcards in the selected deck.
  5. Flashcards APIs are auth-protected and return contract-safe responses.
- **Definition of Done**:
  - Flashcards storage module implemented.
  - Deck, card, and generation API routes implemented with dependency-injected handlers.
  - Study page updated with flashcard deck/card management UI.
  - Flashcards API contract tests added and passing.
- **Artifacts**:
  - `apps/web/lib/storage/flashcards.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/flashcards/decks/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/flashcards/decks/[deckId]/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/flashcards/decks/[deckId]/cards/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/flashcards/decks/[deckId]/cards/[cardId]/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/flashcards/decks/[deckId]/generate/route.ts`
  - `apps/web/app/study/page.tsx`
  - `apps/web/lib/study/flashcards-api-routes.test.ts`

### QUIZ-001 - Quiz Baseline

- **Status**: Todo
- **Notes**: Generate quizzes and track attempts/results.

### STUDY-001 - AI Study Summary

- **Status**: Todo
- **Notes**: Produce concise study summaries from workspace context.

## Sprint 05 Exit Snapshot

- NOTE-001: Done
- FLASH-001: Done
- QUIZ-001: Todo
- STUDY-001: Todo
