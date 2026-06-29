# APROKO PRODUCT BIBLE

## Purpose of This Document

This document is the long-term product playbook for Aproko AI.

It is not a sprint plan and not a technical spec. It is the strategic reference used to decide:

- what we build,
- what we do not build,
- how we design,
- how we communicate,
- and how we prioritize across years, not weeks.

When product decisions are unclear, this document wins.

---

## Chapter 1 - Why Aproko Exists

People lose knowledge every day.

Important insights are buried across documents, chats, notes, recordings, and browser tabs. Traditional tools store information but do not help people continuously understand, connect, and reuse what they know.

Aproko exists to turn fragmented information into a living knowledge system that compounds over time.

---

## Chapter 2 - Mission

Help people capture, organize, and reuse their knowledge with clarity, speed, and confidence.

---

## Chapter 3 - Vision

Aproko becomes the operating system for personal and team knowledge.

In this model:

- Web, desktop, mobile, extension, and meeting tools are clients.
- Memory, retrieval, and reasoning are shared platform capabilities.
- The user experiences one continuous knowledge graph, not disconnected features.

---

## Chapter 4 - Product Philosophy

### We Believe

- Knowledge should never be lost.
- AI should remember on behalf of users.
- AI should explain, not replace thinking.
- AI responses should be evidence-backed with citations.
- AI behavior should be transparent and controllable.

### Strategic Positioning

Aproko is **not** a generic AI chatbot.

Aproko is the **operating system for your knowledge**.

---

## Chapter 5 - Core Principles

1. Build for knowledge quality, not novelty.
2. Do not add features because competitors have them.
3. Every feature must reduce cognitive load.
4. Every AI answer touching user knowledge should reference evidence.
5. Retrieval and reasoning should be auditable.
6. The default UX should feel calm, focused, and trustworthy.
7. Prefer long-term maintainability over short-term hacks.

---

## Chapter 6 - Brand Personality

### Voice

- Friendly
- Professional
- Intelligent
- Calm
- Direct

### Tone Rules

- Never robotic.
- Never hype-driven.
- Never manipulative.
- Always clear about certainty and uncertainty.

---

## Chapter 7 - Design Philosophy

### Design Direction

- Minimal and focused
- High signal, low noise
- Strong typography hierarchy
- Intentional whitespace
- Subtle, meaningful motion

### Inspiration References

- Linear (navigation polish)
- Notion (information structure)
- Vercel (clean operational UI)
- Apple-level restraint and consistency

### Non-Goals

- Over-decorated interfaces
- Feature-heavy, cluttered dashboards
- Dark patterns that push engagement over value

---

## Chapter 8 - Engineering Philosophy

1. Simple first, scalable second.
2. Avoid premature optimization.
3. Build composable modules with clear ownership.
4. Keep API contracts explicit and testable.
5. Instrument for observability from day one.
6. Enforce backlog-driven execution (ticket before implementation).

---

## Chapter 9 - AI Philosophy

The AI is not the product.

Knowledge is the product.

AI is the interface layer that helps users interact with their knowledge system.

### AI Behavior Standards

- Ground outputs in user-approved sources.
- Provide citations whenever source-backed claims are made.
- Separate retrieved facts from generated reasoning.
- Maintain context continuity without inventing memory.
- Surface failure modes clearly when confidence is low.

---

## Chapter 10 - Long-Term Vision (to 2030)

### Platform Horizon

- Unified knowledge graph across personal and team contexts
- Enterprise-grade governance and controls
- Education and research-tailored workflows
- Memory-first agents built on shared context infrastructure

### Product Surface Expansion

- Web (primary, now)
- Desktop app (future client)
- Mobile app (future client)
- Browser extension (future capture client)
- Meeting capture and transcription clients (future ingestion layer)

All surfaces should plug into one platform model, not create isolated products.

---

## Decision Filter

Before approving any new feature, ask:

1. Does it improve knowledge capture, organization, retrieval, or reuse?
2. Does it reduce user cognitive load?
3. Can it be grounded in evidence and citations where relevant?
4. Does it fit the "knowledge OS" direction?
5. Is it aligned with current backlog priorities?

If the answer is no to any critical item, defer or reject.

---

## Execution Rule

No implementation should begin without backlog ownership:

Idea -> Epic -> Feature Spec -> UX Spec -> API Contract -> DB Impact -> Acceptance Criteria -> Ticket -> Implementation -> Review -> Merge

This keeps Aproko disciplined, predictable, and compounding.
