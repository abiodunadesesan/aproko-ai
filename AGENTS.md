# AGENTS.md

Aproko AI Engineering Constitution.

This file is the persistent operating manual for all coding agents working in this repository.

## 1) Product Constraints (Non-Negotiable)

- Build **Aproko AI** as a web-first AI Knowledge Operating System.
- Version 1 scope is web only.
- Do **not** implement desktop apps, mobile apps, browser automation, live meeting recording, voice assistant, or AI phone calls in V1.
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
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand

### Backend and Data
- FastAPI (Python)
- Supabase PostgreSQL
- Clerk
- Supabase Storage
- Qdrant

### AI
- LiteLLM gateway
- Providers: OpenAI, Anthropic, Gemini, Perplexity
- OCR: PaddleOCR

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
