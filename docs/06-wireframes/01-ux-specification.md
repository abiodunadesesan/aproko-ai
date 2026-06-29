# 01 - UX Specification

## Purpose

Define the end-to-end user experience for Aproko AI Version 1 before implementation. This document is the screen-level contract between Product, Design, Engineering, Data, and AI teams.

## Design Direction

Aproko AI should feel premium, calm, and focused on knowledge work:
- Navigation clarity and polish inspired by Linear
- Structured content organization inspired by Notion
- Search-led discovery inspired by Perplexity
- Conversation ergonomics inspired by ChatGPT
- Clean operational layouts inspired by Vercel Dashboard

The experience must remain original to Aproko AI, with knowledge-first workflows.

## Shared UX Rules (All Pages)

- **Knowledge-first navigation**: Primary sidebar is Home, Chat, Library, Memory, Research, Study, Settings.
- **Citation transparency**: AI-generated outputs should expose source provenance where applicable.
- **Progress visibility**: Long-running ingestion/generation operations always show status and next action.
- **Accessibility baseline**: Keyboard navigation, clear focus states, semantic landmarks, and contrast-safe components.
- **Privacy default**: Workspace-scoped data boundaries and explicit permission-sensitive actions.
- **Responsive web behavior**: Mobile web is supported; native mobile apps are out of scope for V1.

---

## 1) Landing Page

### Purpose
- Communicate product value and trust quickly.
- Drive account creation and sign-in conversion.

### Target User
- New visitors evaluating Aproko AI.
- Returning users without active session.

### Primary Actions
- Start free account.
- Sign in.
- View product capability highlights.

### Components
- Hero headline + value proposition.
- Primary CTA (`Get Started`).
- Secondary CTA (`Sign In`).
- Feature overview cards.
- Trust/footer links (privacy, terms, contact).

### Empty State
- Not applicable (marketing page).

### Loading State
- Skeleton for hero and feature cards if SSR data is delayed.

### Error State
- Graceful fallback copy if dynamic sections fail.

### Mobile Responsive Behavior (Web)
- Stacked hero content and CTAs.
- Single-column feature cards.
- Collapsed nav menu.

### Backend APIs Used
- `GET /v1/version` (optional build/version metadata).

### Database Tables Used
- None directly.

### AI Capabilities Used
- None on this page in V1.

---

## 2) Sign In / Sign Up

### Purpose
- Provide secure authentication entry and account recovery.

### Target User
- New and returning users.

### Primary Actions
- Sign up with email/password.
- Sign in with email/password.
- Continue with Google.
- Request and complete password reset.

### Components
- Auth form (email/password).
- Google sign-in button.
- Password reset flow entry.
- Form validation and inline feedback.

### Empty State
- First-time users see onboarding guidance after successful sign-up.

### Loading State
- Button-level spinner during auth requests.

### Error State
- Invalid credentials, duplicate email, expired reset token, OAuth cancellation.

### Mobile Responsive Behavior (Web)
- Single-column centered card.
- Larger tap targets and keyboard-aware spacing.

### Backend APIs Used
- `POST /v1/auth/sign-up`
- `POST /v1/auth/sign-in`
- `POST /v1/auth/google`
- `POST /v1/auth/password-reset/request`
- `POST /v1/auth/password-reset/confirm`

### Database Tables Used
- `profiles`
- `accounts`

### AI Capabilities Used
- None.

---

## 3) Dashboard

### Purpose
- Give users a fast overview of workspace health and next actions.

### Target User
- Authenticated users starting a work session.

### Primary Actions
- Open recent conversations.
- Open recent files.
- Continue pending tasks.
- Jump into chat/library/research quickly.

### Components
- Recent activity feed.
- Uploaded files panel.
- AI conversations panel.
- Memory timeline preview.
- Quick action buttons.

### Empty State
- Guided onboarding checklist (upload first file, start first chat, create first note).

### Loading State
- Card skeletons for each dashboard module.

### Error State
- Partial-render cards with retry actions.

### Mobile Responsive Behavior (Web)
- Cards stack vertically.
- Most recent and most important modules pinned first.

### Backend APIs Used
- `GET /v1/workspaces`
- `GET /v1/workspaces/{workspace_id}/sources`
- `GET /v1/workspaces/{workspace_id}/chat/sessions`
- `GET /v1/workspaces/{workspace_id}/timeline`

### Database Tables Used
- `workspaces`
- `sources`
- `conversations`
- `timeline_events`

### AI Capabilities Used
- Lightweight suggestion prompts (e.g., “continue where you left off”).

---

## 4) AI Chat

### Purpose
- Allow grounded, context-aware conversation over workspace knowledge.

### Target User
- Users asking questions, synthesizing documents, or generating knowledge artifacts.

### Primary Actions
- Send message.
- Scope chat (selected documents, project, full workspace).
- View citations and source excerpts.
- Save output as note/flashcards/quiz/study guide.

### Components
- Thread list.
- Message pane.
- Composer with attachments/context selectors.
- Citation panel.
- Model/status indicators.

### Empty State
- Prompt starter suggestions by workspace context.

### Loading State
- Streaming message skeleton/typing state.

### Error State
- Clear message for model failure, retrieval failure, or network interruption.

### Mobile Responsive Behavior (Web)
- Thread list collapses into drawer.
- Citation panel opens as bottom sheet.

### Backend APIs Used
- `POST /v1/workspaces/{workspace_id}/chat/sessions`
- `GET /v1/workspaces/{workspace_id}/chat/sessions`
- `GET /v1/workspaces/{workspace_id}/chat/sessions/{session_id}`
- `POST /v1/workspaces/{workspace_id}/chat/sessions/{session_id}/messages`
- `GET /v1/workspaces/{workspace_id}/search`

### Database Tables Used
- `conversations`
- `messages`
- `message_citations`
- `source_chunks`
- `memory_items`

### AI Capabilities Used
- Retrieval-augmented response generation.
- Citation generation.
- Context assembly with memory + retrieved chunks.
- Summarization and transformation tools.

---

## 5) Library

### Purpose
- Manage uploaded knowledge assets and ingestion status.

### Target User
- Users organizing source materials for future retrieval and chat.

### Primary Actions
- Upload files.
- Organize by folder/project.
- Inspect processing status.
- Reprocess or remove source.

### Components
- Upload zone.
- Source table/grid with filters.
- Folder/project tree.
- Processing status chips.
- Source metadata drawer.

### Empty State
- Encourages first upload with supported format list.

### Loading State
- Progressive ingestion status updates per file.

### Error State
- Parse/OCR/unsupported-type errors with per-file remediation.

### Mobile Responsive Behavior (Web)
- Compact list view with sticky upload CTA.
- Filters in slide-over.

### Backend APIs Used
- `POST /v1/workspaces/{workspace_id}/sources/upload-url`
- `POST /v1/workspaces/{workspace_id}/sources`
- `GET /v1/workspaces/{workspace_id}/sources`
- `GET /v1/workspaces/{workspace_id}/sources/{source_id}`
- `POST /v1/workspaces/{workspace_id}/sources/{source_id}/reprocess`
- `DELETE /v1/workspaces/{workspace_id}/sources/{source_id}`

### Database Tables Used
- `sources`
- `source_versions`
- `source_chunks`
- `chunk_embeddings`

### AI Capabilities Used
- OCR extraction (images/scanned docs).
- Auto summarization metadata preview (optional V1.1 toggle).

---

## 6) Document Viewer

### Purpose
- Read source content with linked AI citations and extraction metadata.

### Target User
- Users validating AI answers against original material.

### Primary Actions
- Open source file content.
- Jump from citation to source location.
- Highlight/select text for AI actions.

### Components
- Document canvas (PDF/PPT/DOCX/TXT/Markdown/image transcript view).
- Metadata header.
- Citation-linked navigation anchors.
- Side panel for notes/actions.

### Empty State
- If extraction incomplete, show pending-processing state.

### Loading State
- Progressive page/section loading and placeholder canvas.

### Error State
- Corrupted file or render failure fallback with download/reprocess option.

### Mobile Responsive Behavior (Web)
- Single-column content with optional context drawer.
- Sticky action bar (summarize, ask AI, add note).

### Backend APIs Used
- `GET /v1/workspaces/{workspace_id}/sources/{source_id}`
- `GET /v1/workspaces/{workspace_id}/search`

### Database Tables Used
- `sources`
- `source_versions`
- `source_chunks`
- `message_citations`

### AI Capabilities Used
- Citation grounding.
- Inline summarize/rewrite/explain selected content.

---

## 7) Memory Timeline

### Purpose
- Surface long-term memory events and session-spanning context history.

### Target User
- Users revisiting prior insights, decisions, and key facts.

### Primary Actions
- Filter timeline events.
- Open source conversation/document tied to event.
- Pin or dismiss memory items.

### Components
- Chronological timeline feed.
- Filters (type/date/source/project).
- Event detail panel.
- Memory confidence indicator.

### Empty State
- Explain how timeline populates over usage.

### Loading State
- Windowed timeline skeleton entries.

### Error State
- Fallback with retry and filter reset.

### Mobile Responsive Behavior (Web)
- Condensed timeline cards with expandable detail.

### Backend APIs Used
- `GET /v1/workspaces/{workspace_id}/timeline`
- `GET /v1/workspaces/{workspace_id}/memory`
- `POST /v1/workspaces/{workspace_id}/memory/rebuild`

### Database Tables Used
- `memory_items`
- `timeline_events`
- `conversations`
- `sources`

### AI Capabilities Used
- Memory extraction and deduplication.
- Importance/recency ranking.

---

## 8) Research

### Purpose
- Compare multiple documents and generate structured synthesis.

### Target User
- Users conducting analysis across several sources.

### Primary Actions
- Select multiple sources.
- Run comparison prompt.
- Generate structured report and save outputs.

### Components
- Source selection panel.
- Comparison workspace canvas.
- Structured output templates.
- Save/export controls.

### Empty State
- Prompt to choose at least two documents.

### Loading State
- Multi-stage progress (retrieve -> compare -> synthesize).

### Error State
- Partial results + actionable retry scope.

### Mobile Responsive Behavior (Web)
- Source selector becomes modal; results stacked.

### Backend APIs Used
- `GET /v1/workspaces/{workspace_id}/sources`
- `POST /v1/workspaces/{workspace_id}/summaries`
- `POST /v1/workspaces/{workspace_id}/chat/sessions/{session_id}/messages`

### Database Tables Used
- `sources`
- `source_chunks`
- `summaries`
- `notes`

### AI Capabilities Used
- Multi-document retrieval.
- Structured summarization.
- Contradiction/overlap analysis.

---

## 9) Notes

### Purpose
- Create and manage reusable knowledge artifacts.

### Target User
- Users writing, refining, and organizing insights.

### Primary Actions
- Create/edit note.
- Apply AI rewrite/summarize/expand/translate.
- Link note to source or conversation.

### Components
- Notes list panel.
- Rich text editor.
- Tag and metadata controls.
- AI action toolbar.

### Empty State
- “Create your first note” with suggested templates.

### Loading State
- Editor skeleton and autosave status indicator.

### Error State
- Autosave conflict handling and recovery message.

### Mobile Responsive Behavior (Web)
- Full-screen editor with collapsible metadata tray.

### Backend APIs Used
- `GET /v1/workspaces/{workspace_id}/notes`
- `POST /v1/workspaces/{workspace_id}/notes`
- `PATCH /v1/workspaces/{workspace_id}/notes/{note_id}`
- `DELETE /v1/workspaces/{workspace_id}/notes/{note_id}`

### Database Tables Used
- `notes`
- `sources` (for linked references)
- `conversations` (for linked outputs)

### AI Capabilities Used
- Rewrite, summarize, expand, translate.

---

## 10) Flashcards

### Purpose
- Convert knowledge into spaced-repetition study cards.

### Target User
- Learners preparing for retention and recall.

### Primary Actions
- Create deck.
- Generate cards from sources/notes.
- Review and grade recall.

### Components
- Deck list.
- Card review UI.
- Generation controls.
- Review stats panel.

### Empty State
- Suggest generating cards from selected notes/files.

### Loading State
- Card generation progress by batch.

### Error State
- Failed generation entries with retry.

### Mobile Responsive Behavior (Web)
- Swipe-friendly card review.
- Compact deck metrics.

### Backend APIs Used
- `POST /v1/workspaces/{workspace_id}/flashcards/decks`
- `GET /v1/workspaces/{workspace_id}/flashcards/decks`
- `POST /v1/workspaces/{workspace_id}/flashcards/decks/{deck_id}/generate`
- `POST /v1/workspaces/{workspace_id}/flashcards/reviews`

### Database Tables Used
- `flashcard_decks`
- `flashcards`
- `flashcard_reviews`
- `notes`
- `source_chunks`

### AI Capabilities Used
- Card generation from documents/notes/summaries.
- Difficulty balancing and distractor quality heuristics.

---

## 11) Quiz

### Purpose
- Provide assessment workflow over user knowledge domains.

### Target User
- Users testing understanding and measuring progress.

### Primary Actions
- Generate quiz from selected scope.
- Take quiz.
- Submit and review feedback.

### Components
- Quiz list and attempt history.
- Question renderer.
- Progress and timer components (optional timer by mode).
- Result summary panel.

### Empty State
- “Generate your first quiz” from notes/files.

### Loading State
- Quiz generation and grading progress states.

### Error State
- Submission or grading failure with attempt-safe retry.

### Mobile Responsive Behavior (Web)
- One-question-per-screen flow.

### Backend APIs Used
- `POST /v1/workspaces/{workspace_id}/quizzes`
- `GET /v1/workspaces/{workspace_id}/quizzes`
- `POST /v1/workspaces/{workspace_id}/quizzes/{quiz_id}/attempts`
- `POST /v1/workspaces/{workspace_id}/quizzes/{quiz_id}/attempts/{attempt_id}/submit`

### Database Tables Used
- `quizzes`
- `quiz_questions`
- `quiz_attempts`
- `quiz_answers`

### AI Capabilities Used
- Quiz question generation.
- Answer explanation generation.

---

## 12) Settings

### Purpose
- Manage profile, preferences, privacy, workspace controls, and plan access.

### Target User
- Authenticated users and workspace owners.

### Primary Actions
- Update profile.
- Set AI preferences.
- Adjust privacy/workspace settings.
- Manage billing access entry.

### Components
- Settings tabs.
- Profile editor.
- Preference controls.
- Privacy toggles.
- Workspace controls.

### Empty State
- Not applicable.

### Loading State
- Section-level skeletons.

### Error State
- Validation errors and save conflict messaging.

### Mobile Responsive Behavior (Web)
- Tab list collapses to segmented controls/dropdown.

### Backend APIs Used
- `GET /v1/me`
- `PATCH /v1/me/settings`
- `GET /v1/workspaces/{workspace_id}`
- `PATCH /v1/workspaces/{workspace_id}`

### Database Tables Used
- `profiles`
- `workspaces`
- `workspace_memberships`

### AI Capabilities Used
- None required (preference impact is downstream).

---

## 13) Billing

### Purpose
- Allow users to view and manage subscription and usage limits.

### Target User
- Workspace owners and account admins.

### Primary Actions
- View current plan and usage.
- Start/upgrade/downgrade subscription.
- Access invoices/payment methods.

### Components
- Plan card.
- Usage meters.
- Subscription actions.
- Billing history list.

### Empty State
- For free tier: clear upgrade path and plan comparison.

### Loading State
- Meters and invoice skeletons.

### Error State
- Webhook or provider sync delay warning with refresh action.

### Mobile Responsive Behavior (Web)
- Plan cards stack vertically.

### Backend APIs Used
- `GET /v1/billing/subscription`
- `POST /v1/billing/checkout`
- `POST /v1/billing/webhooks` (system path, not user-facing UI action)

### Database Tables Used
- `accounts`
- `subscriptions`
- `billing_events`

### AI Capabilities Used
- None.

---

## UX-to-Data Notes

The next milestone (Database Schema revision) should treat this UX spec as the source of truth for:
- required entities per screen,
- CRUD boundaries,
- and asynchronous workflows that impact state modeling.

## TODO - Open UX Questions

- `TODO`: Final onboarding copy and trust messaging for landing page.
- `TODO`: Exact role granularity for settings and billing in team contexts.
- `TODO`: Final mobile breakpoints for complex comparison/research layouts.
- `TODO`: Decide whether Dashboard includes AI-generated daily brief in V1 or V1.1.
