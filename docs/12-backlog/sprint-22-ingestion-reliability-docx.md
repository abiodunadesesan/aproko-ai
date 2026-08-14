# Sprint 22 — Ingestion Reliability + DOCX

## Status

- **State:** Shipped (web)
- **Depends on:** Sprint 20 source ingestion (`202608131600`)

## Goal

Make library ingestion trustworthy: visible status, DOCX text extraction, and manual reprocess for failed uploads.

## Scope

- DOCX extraction via `mammoth` (≤ 12MB sync ingest)
- Source status machine: `processing` → `ready` | `failed`
- Upload response includes `ingest` summary (status, reason, chunkCount)
- `POST /v1/workspaces/{workspace_id}/sources/{source_id}/reprocess`
- Library UI: Index status column + Re-index action for failed sources

## Out of scope (V1.2+)

- PPTX parsers
- OCR for scanned PDFs
- Async worker queue for large files
- See `v1.2-async-ingestion-ocr.md`

## Database

No new migration. Uses existing `sources.status` column.

## API / behavior

1. Extractable upload → `sources.status = processing` on insert
2. Sync ingest → `ready` (chunks persisted) or `failed` (with reason logged)
3. Non-extractable types (images, audio, pptx) → `ready` immediately, `ingest.status = skipped`
4. Reprocess deletes existing chunks, re-runs extract + chunk + embed pipeline

## Acceptance criteria

1. Upload `.docx` → chunks stored, status `ready`
2. Failed PDF ingest shows `failed` in library with re-index action
3. Reprocess succeeds after fixing/config and replaces chunks
4. Upload toast reflects ingest outcome (indexed vs failed vs skipped)
5. Unit tests for DOCX kind detection and reprocess route auth/validation

## Artifacts

- `apps/web/lib/ingestion/extract-document.ts`
- `apps/web/lib/ingestion/ingest-source.ts`
- `apps/web/lib/storage/library.ts`
- `apps/web/app/api/v1/workspaces/[workspaceId]/sources/[sourceId]/reprocess/route.ts`
- `apps/web/app/(app)/library/page.tsx`
