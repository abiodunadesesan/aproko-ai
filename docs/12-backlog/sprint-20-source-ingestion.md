# Sprint 20 — Source Ingestion (PDF → Chunks → Grounded Chat)

## Status

- **State:** In progress (web sync MVP)
- **Depends on:** personal workspaces (`202607161500`), library upload path

## Goal

When users upload PDFs (and text files), extract readable text, persist retrieval chunks, and hydrate chat/study/search from those chunks.

## Scope (V1 web sync)

- Sync PDF text extraction on upload via `unpdf` (≤ 12MB)
- Persist chunks in `source_chunks` keyed by `workspace_id` + `source_storage_path`
- Lazy re-ingest on first read for PDFs uploaded before this sprint
- Lexical chunk search merged into workspace search results
- Chat grounding via existing `readLibrarySourceText` + `buildWorkspaceContext`

## Out of scope (follow-ups)

- DOCX/PPTX parsers
- OCR for scanned PDFs
- Async worker queue for large files
- Qdrant embeddings / hybrid semantic search
- `POST .../sources/{id}/reprocess` admin route

## Database

Migration: `supabase/migrations/202608131600_create_source_chunks.sql`

## API / behavior

No new public endpoints in MVP. Upload behavior:

1. `POST /v1/workspaces/{workspace_id}/sources` (existing)
2. After storage + metadata persist → sync ingest
3. Upload still returns `201` if ingest fails (source remains in library)

## Acceptance criteria

1. Upload a text-based PDF → chunks stored in `source_chunks`
2. Ask in Chat with source focus → response cites PDF excerpt content
3. Workspace search matches terms inside ingested PDF chunks
4. Deleting a source removes its chunks
5. Unit tests for chunking + extractable type detection

## Artifacts

- `apps/web/lib/ingestion/chunk-text.ts`
- `apps/web/lib/ingestion/extract-document.ts`
- `apps/web/lib/ingestion/ingest-source.ts`
- `apps/web/lib/storage/source-chunks.ts`
- Updates: `library.ts`, `search.ts`, `chat-context.ts`
