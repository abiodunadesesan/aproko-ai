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

### Included
- Authentication: email, Google sign-in, password reset, user profile
- Dashboard: recent activity, uploads, conversations, timeline, quick actions
- Library: PDF, DOCX, PPTX, TXT, Markdown, images, audio uploads with folder/project organization
- AI Chat: normal, selected documents, project scope, workspace scope
- AI Memory: persistent memory from files/notes/chats/summaries
- AI Search: semantic search across workspace assets
- Notes: rich text + AI rewrite/summarize/expand/translate
- Study: flashcards, quizzes, study guides
- Research: multi-document comparison and structured summaries
- Settings: profile, AI preferences, privacy, workspace settings, billing

### Out of Scope (V1)
- Desktop overlay
- Screen capture
- Global shortcuts
- Mobile apps
- Live meeting recording
- Calendar integration
- Email assistant
- Voice assistant
- AI phone calls
- Browser automation

## Primary Navigation

- Home
- Chat
- Library
- Memory
- Research
- Study
- Settings

## Stack Constitution

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand

### Backend and Data
- FastAPI (Python)
- Supabase PostgreSQL
- Supabase Auth
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
