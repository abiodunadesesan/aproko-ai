# Product Blueprint and Engineering Constitution

## Product Definition

Aproko AI is an AI Knowledge Operating System designed to help users store, understand, search, and interact with their own knowledge.

It is not positioned as a generic internet chatbot.

## Vision

Create the world's best AI-powered knowledge workspace where users ask an AI that knows their content, not just public internet content.

## Product Principles

1. Knowledge first
2. Simplicity over feature overload
3. Fast and responsive interfaces
4. Privacy by default
5. Transparent AI responses with citations
6. Long-term memory
7. Modular architecture
8. Production-ready engineering
9. Accessibility
10. Scalability

## V1 Scope (Web Only)

### Included (baseline + Sprint 19 web study-copilot expansion)

- Authentication: email, Google sign-in, password reset, user profile (Clerk)
- Dashboard: recent activity, uploads, conversations, timeline, quick actions
- Library: PDF, DOCX, PPTX, TXT, Markdown, images, audio uploads with folder/project organization
- Transcripts: text upload + browser mic/audio → STT → workspace transcript sources
- AI Chat: workspace-scoped chat with streaming, citations, memory context, voice-to-text input
- AI Memory: persistent memory from files/notes/chats/summaries
- AI Search: workspace search across sources, notes, memory
- Notes + Study: flashcards, quizzes, summaries, slide outlines (LLM when keys configured)
- Writing polish: clarity / concise / professional / academic (not detector evasion)
- Research: multi-document comparison and structured summaries
- Settings: profile, privacy, workspace settings, billing
- Observability: Sentry + PostHog

### Out of Scope (V1 / V1.1 web)

- Desktop overlay / always-on screen-aware capture
- Silent OS audio / bot-free Zoom·Meet·Teams hook
- Global OS shortcuts as a native app
- Mobile apps
- Calendar integration / email assistant products
- Detector-evasion “humanizer” tools (Turnitin/GPTZero framing)
- Voice assistant product surface / AI phone calls
- Browser automation

See V2 companion design: `docs/02-architecture/03-desktop-companion-v2.md`.

## Primary Navigation

- AI Chat
- Dashboard
- Search
- My Transcripts
- Documents (Library)
- Remembered (Memory)
- Research
- Study Materials
- Writing
- Profile / Billing / Admin (role-gated)

## Stack Constitution

### Frontend

- Next.js 16 (App Router) in production web app
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend and Data

- Next.js `/api/v1` Route Handlers (current production path)
- FastAPI service packages under `backend/` (future extraction target)
- Supabase PostgreSQL
- Clerk
- Supabase Storage
- Qdrant (target vector tier)

### AI

- Vercel AI SDK in `apps/web` for chat/study/writing
- OpenAI Whisper for browser-provided audio STT
- LiteLLM remains the multi-service gateway target as workers mature
- Providers: OpenAI, Anthropic, Gemini, Perplexity (as keys/config allow)
- OCR: PaddleOCR (worker architecture target)

### Infra and Ops

- Vercel
- Railway
- Docker
- GitHub Actions
- Cloudflare
- Sentry
- PostHog

## Engineering Standards

- SOLID principles
- clean architecture
- composition over inheritance
- reusable modules and components
- documented APIs
- tests where appropriate
- maintainability and scalability first

## AI Response Standards

- Ground in user knowledge when available
- Provide citations when evidence is present
- Distinguish retrieved evidence from generated synthesis
- Preserve conversation context
- Never fabricate citations

## Delivery Gate

Before implementing any feature:

1. Confirm product requirement in PRD
2. Confirm architecture support
3. Confirm database support
4. Confirm API contract support
5. Then implement

## Unknowns and TODO Policy

If requirements are missing or ambiguous, add a `TODO` section. Do not guess.

## Cross References

- PRD: `../01-prd/README.md`
- Architecture: `./README.md`
- Database: `../03-database/README.md`
- API: `../04-api/README.md`
- Design system: `../05-design-system/README.md`
- AI memory: `../07-ai-memory/README.md`
- RAG: `../08-rag/README.md`
- Deployment: `../11-deployment/README.md`
