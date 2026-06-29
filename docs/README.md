# Aproko AI Documentation Hub

This documentation defines the product and technical architecture for **Aproko AI (Version 1)**.

## Scope

Version 1 includes only:
- Web application
- Authentication (email, Google sign-in, password reset, user profile)
- Dashboard (recent activity, uploads, conversations, memory timeline, quick actions)
- Library uploads and organization (PDF, DOCX, PPTX, TXT, Markdown, images, audio)
- AI chat (normal, selected docs, project scope, workspace scope)
- AI memory and timeline
- AI search
- Notes with AI actions
- Study tools (flashcards, quizzes, study guides)
- Research workspace
- Settings, billing, and admin dashboard

Version 1 excludes desktop apps, mobile apps, browser automation, and live meeting recording.

## Document Map

- `01-prd` - Product Requirements Document
- `02-architecture/PRODUCT_BLUEPRINT.md` - Product blueprint and engineering constitution
- `02-architecture` - System architecture and runtime topology
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
