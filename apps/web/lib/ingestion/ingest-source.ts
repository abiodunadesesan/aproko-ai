import { chunkText, estimateTokenCount } from '@/lib/ingestion/chunk-text';
import { extractDocumentText, resolveExtractableKind } from '@/lib/ingestion/extract-document';
import { getLibraryBucketName, type LibrarySource } from '@/lib/storage/library';
import {
  joinSourceChunkText,
  listSourceChunks,
  replaceSourceChunks,
} from '@/lib/storage/source-chunks';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type IngestSourceResult =
  | { status: 'ingested'; chunkCount: number; characterCount: number }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string };

async function downloadSourceBuffer(objectPath: string): Promise<ArrayBuffer | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const download = await supabase.storage.from(getLibraryBucketName()).download(objectPath);
  if (download.error || !download.data) {
    console.warn('Unable to download source for ingestion.', download.error?.message);
    return null;
  }

  return download.data.arrayBuffer();
}

async function updateSourceIngestStatus(
  workspaceId: string,
  objectPath: string,
  status: 'ready' | 'failed',
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from('sources')
    .update({ status })
    .eq('workspace_id', workspaceId)
    .eq('storage_path', objectPath);

  if (error) {
    console.warn('Unable to update source ingest status.', error.message);
  }
}

export async function ingestLibrarySource(source: LibrarySource): Promise<IngestSourceResult> {
  const kind = resolveExtractableKind(source.name, source.mimeType);
  if (!kind) {
    return { status: 'skipped', reason: 'unsupported_type' };
  }

  const existing = await listSourceChunks(source.workspaceId, source.objectPath);
  if (existing.length > 0) {
    return {
      status: 'ingested',
      chunkCount: existing.length,
      characterCount: joinSourceChunkText(existing).length,
    };
  }

  const buffer = await downloadSourceBuffer(source.objectPath);
  if (!buffer) {
    await updateSourceIngestStatus(source.workspaceId, source.objectPath, 'failed');
    return { status: 'failed', reason: 'download_failed' };
  }

  try {
    const extracted = await extractDocumentText({
      fileName: source.name,
      mimeType: source.mimeType,
      buffer,
    });

    if (!extracted.trim()) {
      await updateSourceIngestStatus(source.workspaceId, source.objectPath, 'failed');
      return { status: 'failed', reason: 'empty_document' };
    }

    const chunks = chunkText(extracted);
    const persisted = await replaceSourceChunks(
      source.workspaceId,
      source.objectPath,
      chunks.map((content) => ({
        content,
        tokenCount: estimateTokenCount(content),
        metadata: { sourceType: kind },
      })),
    );

    if (persisted === 0) {
      await updateSourceIngestStatus(source.workspaceId, source.objectPath, 'failed');
      return { status: 'failed', reason: 'persist_failed' };
    }

    await updateSourceIngestStatus(source.workspaceId, source.objectPath, 'ready');
    return {
      status: 'ingested',
      chunkCount: persisted,
      characterCount: extracted.length,
    };
  } catch (error) {
    await updateSourceIngestStatus(source.workspaceId, source.objectPath, 'failed');
    const reason = error instanceof Error ? error.message : 'extract_failed';
    console.warn('Source ingestion failed.', reason);
    return { status: 'failed', reason };
  }
}

export async function readIngestedSourceText(
  source: LibrarySource,
): Promise<{ title: string; content: string; sourceId: string } | null> {
  let chunks = await listSourceChunks(source.workspaceId, source.objectPath);
  if (chunks.length === 0) {
    const ingest = await ingestLibrarySource(source);
    if (ingest.status !== 'ingested') {
      return null;
    }
    chunks = await listSourceChunks(source.workspaceId, source.objectPath);
  }

  const content = joinSourceChunkText(chunks).trim();
  if (!content) {
    return null;
  }

  return {
    title: source.name,
    content,
    sourceId: source.id,
  };
}
