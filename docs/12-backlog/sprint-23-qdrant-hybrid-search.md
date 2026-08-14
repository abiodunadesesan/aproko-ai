# Sprint 23 — Qdrant Hybrid Search

## Status

- **State:** Shipped (web)
- **Depends on:** Sprint 22 ingestion reliability

## Goal

Add semantic retrieval over ingested source chunks and merge with existing lexical search for paraphrased queries.

## Scope

- `chunk_embeddings` table mapping chunk IDs to Qdrant point IDs
- Embed chunks on ingest via OpenAI `text-embedding-3-small` (when `OPENAI_API_KEY` set)
- Qdrant upsert with workspace-scoped payload filter
- Hybrid merge in `searchWorkspace`: lexical ILIKE + semantic ANN
- Graceful fallback to lexical-only when Qdrant or embeddings unavailable

## Out of scope

- Dedicated `POST /search/semantic` route (hybrid is integrated into `GET /search`)
- Cross-workspace search
- Re-ranking model / cross-encoder
- Memory-item vector search (separate backlog)

## Database

Migration: `supabase/migrations/202608141000_create_chunk_embeddings.sql`

## Environment

- `QDRANT_URL` — Qdrant cluster URL (required for semantic leg)
- `QDRANT_API_KEY` — optional API key
- `OPENAI_API_KEY` — required for embedding generation
- `QDRANT_SOURCE_CHUNKS_COLLECTION` — optional override (default `aproko_source_chunks`)

## Acceptance criteria

1. Ingested chunks upserted to Qdrant when env configured
2. Search returns semantically relevant chunks for paraphrased queries
3. Lexical-only fallback when Qdrant/OpenAI not configured
4. Reprocess replaces Qdrant points for the source
5. Unit tests for hybrid merge scoring and Qdrant config guard

## Artifacts

- `supabase/migrations/202608141000_create_chunk_embeddings.sql`
- `apps/web/lib/retrieval/qdrant-client.ts`
- `apps/web/lib/retrieval/embed-source-chunks.ts`
- `apps/web/lib/retrieval/hybrid-search.ts`
- `apps/web/lib/storage/search.ts`
