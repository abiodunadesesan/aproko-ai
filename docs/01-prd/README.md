# 01 - Product Requirements Document (PRD)

## Executive Summary

Aproko AI is a web-first AI knowledge operating system that helps users capture, structure, retrieve, and reuse knowledge across documents, conversations, and time. Version 1 focuses on high-signal knowledge workflows for individuals and teams: AI chat over uploaded materials, memory-aware retrieval, notes, study tools, and research workspace orchestration.

## Product Vision

Create a reliable AI workspace where users can ask better questions, get grounded answers with citations, and continuously build reusable knowledge artifacts (notes, flashcards, summaries, timelines, and quizzes).

## Mission

Reduce cognitive load in knowledge work by turning fragmented information into an organized, searchable, and evolving memory system.

## User Personas

1. **Independent Knowledge Worker**
   - Consultants, analysts, founders
   - Needs rapid synthesis and high recall across many files
2. **Research Student / Academic User**
   - Needs citation-backed understanding, summaries, and study assets
3. **Operations / Strategy Team Member**
   - Needs meeting transcript processing and timeline reconstruction
4. **Admin / Team Owner**
   - Manages users, permissions, usage, and billing governance

## User Problems

- Knowledge spread across files and conversations is hard to reuse.
- Users lose context across sessions and projects.
- Manual synthesis is slow and inconsistent.
- Search is keyword-limited and often misses intent.
- Meeting and research outputs are not transformed into reusable assets.

## Success Metrics

### Product Metrics
- Weekly active users (WAU)
- D30 retention by workspace type
- % of sessions with citation-backed responses
- Knowledge artifact creation rate (notes, flashcards, quizzes)
- Time-to-first-value (upload -> first useful answer)

### Quality Metrics
- Retrieval precision@k (internal evals)
- Answer grounding rate (responses with valid citations)
- OCR processing success rate
- P95 API latency by endpoint class

### Business Metrics
- Free -> paid conversion
- Paid churn
- Average revenue per account

`TODO`: Define target numeric thresholds for each KPI after baseline instrumentation.

## Functional Requirements

### Core Knowledge Workflows
1. User can create and manage workspaces.
2. User can upload files: PDF, DOCX, PPTX, TXT, Markdown, images, and audio.
3. System extracts text, metadata, and OCR content.
4. User can chat with workspace-aware context.
5. Responses include references/citations to source chunks.
6. User can save generated notes, summaries, flashcards, and quizzes.
7. User can upload meeting transcripts and generate summaries/actions.
8. User can perform global and workspace-scoped search.
9. User has timeline view of key memory events.

### Account & Administration
10. User can authenticate via Clerk (email + Google sign-in + password reset).
11. User can manage profile and settings.
12. Billing plans and subscription state are enforced in feature gates.
13. Admin dashboard supports user/workspace/usage oversight.

## Non-Functional Requirements

- Availability target: 99.9% for core APIs.
- Security: RBAC, row-level access controls, auditability.
- Privacy: data isolation per workspace and tenant.
- Scalability: asynchronous ingestion and indexing pipelines.
- Observability: end-to-end traces, logs, and product analytics.
- Accessibility: WCAG 2.1 AA baseline.

`TODO`: Confirm compliance targets (SOC 2, GDPR, HIPAA scope).

## User Stories (Selected)

- As a user, I upload PDF/DOCX/PPTX/TXT/Markdown/image/audio content and ask grounded questions with citations.
- As a user, I generate flashcards from selected notes.
- As a user, I revisit prior sessions and see memory timeline context.
- As an admin, I review usage trends and account-level health.
- As a paid user, I access higher usage limits and advanced features.

## Acceptance Criteria (Selected)

1. **Upload + Parse**
   - Given a supported file, system stores file and extraction metadata.
   - Unsupported or corrupted files return structured errors.
2. **Grounded Chat**
   - Responses include source references when retrieval context is used.
   - If retrieval confidence is low, assistant indicates uncertainty.
3. **Search**
   - Search returns hybrid-ranked items (keyword + semantic).
   - Results can filter by source type/date/workspace.
4. **Billing Gate**
   - Plan-limited features return clear upgrade prompt.

## Information Architecture

- Workspaces
  - Sources (documents, transcripts, media)
  - Conversations
  - Notes
  - Flashcards
  - Quizzes
  - Timeline

- Global
  - Search
  - Settings
  - Billing
  - Admin (role-gated)

## Navigation

- Primary sidebar: Home, Chat, Library, Memory, Research, Study, Settings
- Top bar: Search, quick actions, profile
- Utility routes: Settings, Billing, Admin

## User Flows

1. **Onboarding**: Sign up -> create workspace -> upload first source -> run first chat.
2. **Research**: Upload docs -> ask questions -> generate summary -> save notes.
3. **Study**: Generate flashcards/quizzes from selected content -> review progress.
4. **Meeting Intelligence**: Upload transcript -> summarize -> extract actions -> pin notes.

## Permissions

- **Owner**: billing/admin/workspace governance
- **Editor**: manage content + interact with AI features
- **Viewer**: read/search/chat with restricted mutation
- **Platform Admin**: system-level operations (internal)

`TODO`: Confirm whether Viewer can generate artifacts (flashcards/quizzes) in V1.

## Pricing

- Plan tiers: Free, Pro, Team (initial structure)
- Limits dimensioned by:
  - Storage
  - Monthly AI requests/tokens
  - OCR/transcript processing volume
  - Team seats

`TODO`: Define final prices, limits, and overage policy.


## Out of Scope (V1)

- Desktop overlay
- Screen capture and global shortcuts
- Mobile applications
- Live meeting recording
- Calendar integration
- Email assistant
- Voice assistant
- AI phone calls
- Browser automation


## Future Roadmap (Post-V1)

- Desktop overlay assistant
- Mobile companion app
- Realtime meeting capture
- Proactive memory suggestions

## Risks

- Hallucinations without strong grounding controls
- OCR quality variability on low-quality scans
- Vendor dependency risk (model/provider changes)
- Cost volatility from multi-model usage
- Privacy/security incidents if isolation controls fail

## Technical Constraints

- Frontend: Next.js 15 + React 19 + TypeScript + Tailwind + shadcn/ui
- Backend: FastAPI (Python)
- Data: Supabase PostgreSQL + Supabase Storage + Qdrant
- AI gateway: LiteLLM routing to OpenAI/Anthropic/Gemini/Perplexity
- Monitoring: Sentry + PostHog + platform observability

## Cross References

- Architecture: `../02-architecture/README.md`
- Database: `../03-database/README.md`
- API: `../04-api/README.md`
- AI Memory: `../07-ai-memory/README.md`
- RAG: `../08-rag/README.md`
