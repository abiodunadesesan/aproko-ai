# Sprint 24 — Async Ingestion + PPTX (V1.2 Step 1)

## Status

- **State:** Shipped (web step 1)
- **Depends on:** Sprint 22/23 sync ingest + hybrid search

## Goal

Extend ingestion beyond sync PDF/DOCX/text: PPTX extraction, async processing for large files, and clearer scanned-PDF messaging while OCR worker remains planned.

## Scope

- PPTX text extraction via `jszip` (slide XML, sync path)
- Async background ingest for files > 12MB (Next.js `after()` on upload route)
- `MAX_ASYNC_INGEST_BYTES` = 50MB download/extract limit
- Scanned PDF detection (empty extract) → `failed` with `scanned_pdf_requires_ocr`
- Library polling while any source is `processing`

## Out of scope (follow-up)

- Image OCR (non-PDF sources)
- SSE ingest progress stream

## A.2 (shipped)

- `ingest_jobs` migration + queue on scanned PDF detection
- Python PaddleOCR worker: `backend/workers/ocr`
- Web processor: `OCR_WORKER_URL`, internal drain route `/api/v1/internal/ingest/process-ocr`

## Acceptance criteria

1. Upload `.pptx` → indexed like DOCX
2. Upload >12MB text/PDF/DOCX/PPTX → upload returns quickly, status `processing`, completes async
3. Scanned PDF → `Index failed` with OCR guidance
4. Library auto-refreshes while sources are processing

## Artifacts

- `apps/web/lib/ingestion/extract-document.ts`
- `apps/web/lib/ingestion/schedule-async-ingest.ts`
- `apps/web/app/api/v1/workspaces/[workspaceId]/sources/route.ts`
- `apps/web/app/(app)/library/page.tsx`
