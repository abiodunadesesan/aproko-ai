# AGENTS.md

Aproko AI Engineering Constitution.

This file is the persistent operating manual for all coding agents working in this repository.

## 1) Product Constraints (Non-Negotiable)

- Build **Aproko AI** as a web-first AI Knowledge Operating System.
- Version 1 / V1.1 delivery surface is **web only** (`apps/web`).
- Do **not** implement desktop apps, mobile apps, browser automation, invisible system meeting capture, voice assistant product, or AI phone calls without an approved V2 epic.
- **Web-safe study copilot expansion (Sprint 19, shipped):**
  - User-initiated browser mic/upload → transcript (Whisper when `OPENAI_API_KEY` is set)
  - LLM study pipeline (summaries, flashcards, quizzes, slide outlines) from notes/transcripts
  - Grounded chat with hydrated source/transcript excerpts + memory + chat voice input
  - Legitimate writing polish (clarity / concise / professional / academic)
  - Optional transparency detector check (GPTZero when `GPTZERO_API_KEY` is set; Turnitin via institutional portal only)
- Do **not** build detector-evasion writing tools (e.g. marketed to beat Turnitin/GPTZero, or rewrite-to-lower-detector-score).
- Desktop screen overlay + OS-level meeting/audio capture = **V2 companion** only  
  (`docs/12-backlog/sprint-19-web-study-copilot.md`, `docs/02-architecture/03-desktop-companion-v2.md`).
- Browser extension live tab/DOM capture + floating overlay = **V2 companion** only  
  (`docs/02-architecture/04-browser-extension-companion-v2.md`, `docs/12-backlog/sprint-29-browser-extension-v2.md`).
  Sprint 29 is PO-approved; package lives in `apps/extension/extension` and must not be treated as the V1 default web surface.
- Prefer `TODO` sections over unsupported assumptions.
- Every implementation must map to documented architecture and approved product scope.

## 2) Delivery Sequence (Required)

Always follow this high-level order unless explicitly changed by the product owner:

1. Product blueprint and PRD
2. UX specification and wireframes
3. Overall system architecture
4. User journey architecture
5. AI memory architecture
6. RAG pipeline
7. Database schema
8. API specification
9. Design system
10. Scaffolding and implementation

## 3) Architecture Principles

- Knowledge-first UX and system behavior.
- Modular, loosely coupled services.
- Clear separation of concerns (UI, API, workers, retrieval, memory).
- Async pipelines for heavy processing.
- Retrieval-grounded AI responses with citations.
- Privacy by default and tenant isolation by design.
- Observability-first production engineering.

## 4) Tech Stack Decisions

Use these defaults unless a documented architecture decision changes them:

### Frontend

- Next.js 16 (App Router) — V1 was planned on 15; production web ships Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query (where used)
- Zustand (where used)

### Backend and Data

- Primary V1/V1.1 web APIs: Next.js Route Handlers under `apps/web/app/api/v1`
- FastAPI (Python) packages under `backend/` remain the long-term service split target
- Supabase PostgreSQL
- Clerk
- Supabase Storage
- Qdrant (retrieval acceleration; hybrid lexical search live in web today)

### AI

- Current web generation: Vercel AI SDK (`ai` + `@ai-sdk/*`) for chat/study/writing
- Speech-to-text: OpenAI Whisper (`whisper-1`) when `OPENAI_API_KEY` is set
- Target gateway for multi-service routing: LiteLLM (architecture default; not required for every Route Handler call yet)
- Providers: OpenAI, Anthropic, Gemini (+ Perplexity when wired)
- OCR: PaddleOCR (worker path; architecture target)

### Infra and Ops

- Vercel
- Railway
- Docker
- GitHub Actions
- Cloudflare
- Sentry
- PostHog

## 5) Folder Structure Rules

- `apps/` for user-facing applications.
- `backend/` for API/workers/AI processing services.
- `packages/` for shared code (ui, sdk, prompts, types).
- `docs/` for architecture and product documentation.
- Keep cross-cutting interfaces in shared packages; avoid duplicate type definitions.

## 6) Naming Conventions

- Use explicit, domain-oriented names.
- Prefer singular names for model/entity types and plural for collections.
- Use consistent suffixes:
  - `*Service` for domain services
  - `*Repository` for persistence adapters
  - `*Client` for external integrations
  - `*DTO` for transport objects
- API paths should be versioned and resource-based (`/v1/...`).

## 7) Coding Standards

- Follow SOLID and clean architecture principles.
- Prefer composition over inheritance.
- Keep functions small and testable.
- Avoid hidden side effects and implicit globals.
- Validate all external inputs.
- Maintain strict TypeScript and Python typing discipline.
- Keep comments concise and focused on intent, not obvious behavior.

## 8) AI Engineering Guidelines

- Ground responses in retrieved user knowledge when available.
- Include source citations for grounded outputs.
- Never fabricate citations.
- Distinguish retrieved evidence from generated synthesis.
- Preserve conversation context with memory-aware retrieval.
- Log prompt/model/retrieval metadata for observability and evaluation.

## 9) Documentation Rules

- Update docs before or alongside implementation changes.
- Keep docs synchronized with actual behavior.
- Cross-reference related docs instead of duplicating full sections.
- Mark unknown business decisions using `TODO` blocks.
- Architecture and API docs are required for new capabilities before coding.

## 10) Testing Expectations

Minimum expectations before merge:

- Unit tests for new domain logic.
- Integration tests for API and persistence changes.
- E2E tests for critical user journeys (auth, upload, chat, citation view).
- Regression checks for memory and retrieval flows.
- Lint and typecheck must pass in CI.

## 11) Pull Request Checklist

- Requirement exists in PRD/approved scope.
- Architecture impact documented.
- Database changes documented and migration-safe.
- API contracts updated.
- Tests added/updated and passing.
- Security/privacy implications reviewed.
- Observability instrumentation added (logs/metrics/errors).
- User-facing behavior reflected in docs.

## 12) Security and Privacy Baseline

- Enforce authentication and authorization on every protected route.
- Scope data access by workspace/account boundaries.
- Use signed URLs and least-privilege secrets.
- Never commit secrets.
- Capture audit logs for privileged operations.

## 13) Agent Working Rules

Before implementing any feature:

1. Confirm requirement exists.
2. Confirm architecture supports it.
3. Confirm database model supports it.
4. Confirm API contract supports it.
5. Then implement.

If any of the above is missing, stop and add/update documentation first.
