# Options A–D — Step-by-Step Roadmap

## Sequence

| Step | Option | Sprint doc | Status |
|------|--------|------------|--------|
| 1 | **A** Async ingestion + PPTX | `sprint-24-async-ingestion-pptx.md` | Shipped |
| 2 | **B** Chat composer (PromptInput) | `sprint-25-chat-prompt-input.md` | Shipped |
| 3 | **C** Release polish | `sprint-26-release-polish.md` | Shipped |
| 4 | **D** Live Paddle billing | `sprint-27-stripe-billing-live.md` | Implemented |
| 5 | **Plan gates** | `sprint-28-plan-feature-gates.md` | Implemented |

## Option A phases

- **A.1 (this sprint):** PPTX, async large files, polling, scanned-PDF message
- **A.2 (shipped):** PaddleOCR worker (`backend/workers/ocr`), `ingest_jobs` table, OCR queue on scanned PDFs

## Option B

Replace custom chat `Composer` with AI Elements `PromptInput`; keep custom SSE backend (no `useChat` migration in MVP).

## Option C

Mobile library layout, copy sweep, release checklist closure, optional PostHog.

## Option D

Supabase `subscriptions` + `billing_events` migrations, Vercel Paddle env, webhook smoke test.
