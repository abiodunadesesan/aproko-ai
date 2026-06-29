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

- **Status**: Done
- **Product Specification**: Users can create quizzes, generate baseline multiple-choice questions from notes, submit attempts, and view recent quiz scores in Study.
- **API Contract**:
  - `GET /api/v1/workspaces/{workspaceId}/quizzes`
  - `POST /api/v1/workspaces/{workspaceId}/quizzes`
  - `GET /api/v1/workspaces/{workspaceId}/quizzes/{quizId}`
  - `POST /api/v1/workspaces/{workspaceId}/quizzes/{quizId}/generate`
  - `GET /api/v1/workspaces/{workspaceId}/quizzes/{quizId}/attempts`
  - `POST /api/v1/workspaces/{workspaceId}/quizzes/{quizId}/attempts`
  - `POST /api/v1/workspaces/{workspaceId}/quizzes/{quizId}/attempts/{attemptId}/submit`
- **Acceptance Criteria**:
  1. Study page allows creating and selecting quizzes.
  2. User can generate quiz questions from the active note.
  3. User can answer generated quiz questions and submit an attempt.
  4. Attempt score and totals are returned and displayed.
  5. Quiz APIs are auth-protected and tested.
- **Definition of Done**:
  - Quizzes storage module implemented.
  - Quiz, generation, and attempt API routes implemented with dependency-injected handlers.
  - Study page updated with quiz creation, question answer, and result display.
  - Quiz API contract tests added and passing.
- **Artifacts**:
  - `apps/web/lib/storage/quizzes.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/quizzes/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/quizzes/[quizId]/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/quizzes/[quizId]/generate/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/quizzes/[quizId]/attempts/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/quizzes/[quizId]/attempts/[attemptId]/submit/route.ts`
  - `apps/web/app/study/page.tsx`
  - `apps/web/lib/study/quiz-api-routes.test.ts`

### STUDY-001 - AI Study Summary

- **Status**: Done
- **Product Specification**: Users can generate and persist concise AI-style study summaries from active note context (or workspace notes fallback) directly in Study.
- **API Contract**:
  - `GET /api/v1/workspaces/{workspaceId}/summaries`
  - `POST /api/v1/workspaces/{workspaceId}/summaries`
  - `POST /api/v1/workspaces/{workspaceId}/summaries/generate`
- **Acceptance Criteria**:
  1. Study page can generate summary from the active note.
  2. When no active note is selected, summary generation uses workspace notes context.
  3. Generated summary is persisted and visible in the Study summaries list.
  4. User can search summaries by title/content.
  5. Summaries APIs are auth-protected and tested.
- **Definition of Done**:
  - Study summaries storage module implemented.
  - Summary list/create/generate API routes implemented with dependency-injected handlers.
  - Study page updated with AI summary generation and summary list UI.
  - Study summary API contract tests added and passing.
- **Artifacts**:
  - `apps/web/lib/storage/summaries.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/summaries/route.ts`
  - `apps/web/app/api/v1/workspaces/[workspaceId]/summaries/generate/route.ts`
  - `apps/web/app/study/page.tsx`
  - `apps/web/lib/study/study-summaries-api-routes.test.ts`

## Sprint 05 Exit Snapshot

- NOTE-001: Done
- FLASH-001: Done
- QUIZ-001: Done
- STUDY-001: Done
