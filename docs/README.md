# Aproko AI Documentation Hub

This documentation defines the product and technical architecture for **Aproko AI (Version 1)**.

## Scope

Version 1 includes:

- Web application (`apps/web` on Next.js)
- Authentication (email, Google sign-in, password reset, user profile)
- Dashboard (recent activity, uploads, conversations, memory timeline, quick actions)
- Library uploads and organization (PDF, DOCX, PPTX, TXT, Markdown, images, audio)
- Transcripts (text upload + browser mic/audio STT)
- AI chat (workspace grounding, citations, memory, voice input)
- AI memory and search
- Notes and study tools (flashcards, quizzes, summaries, slide outlines)
- Writing polish (clarity/tone)
- Research workspace
- Settings, billing, and admin dashboard
- Observability (Sentry, PostHog)

Version 1 excludes native desktop/mobile apps, browser automation, invisible OS meeting capture, and detector-evasion humanizers.  
V2 desktop companion design: `02-architecture/03-desktop-companion-v2.md`.  
Sprint 19 board: `12-backlog/sprint-19-web-study-copilot.md`.

## Document Map

- `00-product/APROKO_PRODUCT_BIBLE.md` - Product identity, principles, and long-term direction
- `01-prd` - Product Requirements Document
- `02-architecture/PRODUCT_BLUEPRINT.md` - Product blueprint and engineering constitution
- `02-architecture/00-technical-blueprint.md` - Unified epic-driven technical architecture
- `02-architecture` - System architecture and runtime topology
- `02-architecture/03-desktop-companion-v2.md` - V2 desktop capture companion (design only)
- `03-database` - PostgreSQL schema and data model
- `04-api` - REST API contracts
- `05-design-system` - UI foundations and accessibility standards
- `06-wireframes` - IA and UX wireframes
- `07-ai-memory` - Memory architecture and lifecycle
- `08-rag` - Retrieval-augmented generation design
- `09-prompts` - Prompt management and quality controls
- `10-roadmap` - Delivery phases and milestones
- `11-deployment` - Deployment, observability, CI/CD, and ops

## Governance

- Unknown business decisions are marked with `TODO`.
- Architecture choices prioritize maintainability, observability, and scalability.
- All implementation work should map back to these docs.
