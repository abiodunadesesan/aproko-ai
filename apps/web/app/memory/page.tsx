'use client';

import { useCallback, useEffect, useState } from 'react';
import { buttonPrimaryClass, cardClass, inputClass } from '@aproko/ui';
import { AppShell } from '@/components/app-shell';

const WORKSPACE_ID = 'default-workspace';
const memoryTypes = [
  'fact',
  'preference',
  'project',
  'decision',
  'task',
  'timeline_event',
] as const;
type MemoryType = (typeof memoryTypes)[number];
const labelClass = 'text-sm font-medium';

type MemoryItem = {
  id: string;
  workspaceId: string;
  memoryType: MemoryType;
  summary: string;
  importanceScore: number | null;
  rankScore?: number;
  createdAt: string;
  updatedAt: string;
  embeddingJob?: {
    status: 'not_started' | 'queued' | 'processing' | 'completed' | 'failed';
    model: string;
    queuedAt: string;
  };
  references?: {
    sourceIds: string[];
    messageIds: string[];
    relatedMemoryIds: string[];
  };
  relatedItems?: Array<{
    memoryItemId: string;
    score: number;
    reason: string;
  }>;
};

type MemoryItemsResponse = {
  data?: MemoryItem[];
  error?: string;
};

export default function MemoryPage() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [memoryType, setMemoryType] = useState<MemoryType>('fact');
  const [summary, setSummary] = useState('');
  const [importanceScore, setImportanceScore] = useState('0.60');
  const [sourceIdsRaw, setSourceIdsRaw] = useState('');
  const [messageIdsRaw, setMessageIdsRaw] = useState('');
  const [relatedMemoryIdsRaw, setRelatedMemoryIdsRaw] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueingItemId, setQueueingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/memory/items?sort=ranked`);
      const payload = (await response.json()) as MemoryItemsResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to load memory items');
      }

      setItems(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load memory items');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const parsedScore = Number(importanceScore);
    if (!summary.trim()) {
      setError('Summary is required');
      return;
    }

    if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 1) {
      setError('Importance score must be between 0 and 1');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const parseIds = (raw: string) =>
        raw
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);

      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/memory/items`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          memoryType,
          summary: summary.trim(),
          importanceScore: parsedScore,
          sourceIds: parseIds(sourceIdsRaw),
          messageIds: parseIds(messageIdsRaw),
          relatedMemoryIds: parseIds(relatedMemoryIdsRaw),
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to create memory item');
      }

      setSummary('');
      setSourceIdsRaw('');
      setMessageIdsRaw('');
      setRelatedMemoryIdsRaw('');
      await loadItems();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create memory item');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function queueEmbedding(itemId: string) {
    if (queueingItemId) {
      return;
    }

    setQueueingItemId(itemId);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/memory/items/${itemId}/embed`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ model: 'text-embedding-3-small' }),
        },
      );

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to queue embedding');
      }

      await loadItems();
    } catch (queueError) {
      setError(queueError instanceof Error ? queueError.message : 'Failed to queue embedding');
    } finally {
      setQueueingItemId(null);
    }
  }

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  return (
    <AppShell
      subtitle="Memory timeline baseline for Sprint 4. Capture workspace memory items before embeddings and retrieval layers."
      title="Memory"
    >
      <section className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <form className={`${cardClass} space-y-3`} onSubmit={onSubmit}>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Capture Memory</h2>
            <p className="text-xs text-muted-foreground">MEM-001 baseline contract</p>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="memory-type">
              Memory Type
            </label>
            <select
              className={`${inputClass} h-10`}
              id="memory-type"
              onChange={(event) => setMemoryType(event.target.value as MemoryType)}
              value={memoryType}
            >
              {memoryTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="memory-summary">
              Summary
            </label>
            <textarea
              className={`${inputClass} min-h-24`}
              id="memory-summary"
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Captured memory statement..."
              value={summary}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="importance-score">
              Importance Score (0-1)
            </label>
            <input
              className={inputClass}
              id="importance-score"
              inputMode="decimal"
              onChange={(event) => setImportanceScore(event.target.value)}
              value={importanceScore}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="source-ids">
              Source IDs (comma-separated)
            </label>
            <input
              className={inputClass}
              id="source-ids"
              onChange={(event) => setSourceIdsRaw(event.target.value)}
              placeholder="src-1, src-2"
              value={sourceIdsRaw}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="message-ids">
              Message IDs (comma-separated)
            </label>
            <input
              className={inputClass}
              id="message-ids"
              onChange={(event) => setMessageIdsRaw(event.target.value)}
              placeholder="msg-1, msg-2"
              value={messageIdsRaw}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="related-memory-ids">
              Related Memory IDs (comma-separated)
            </label>
            <input
              className={inputClass}
              id="related-memory-ids"
              onChange={(event) => setRelatedMemoryIdsRaw(event.target.value)}
              placeholder="mem-3, mem-9"
              value={relatedMemoryIdsRaw}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button className={buttonPrimaryClass} disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Saving...' : 'Save Memory'}
          </button>
        </form>

        <div className={`${cardClass} space-y-3`}>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Memory Timeline</h2>
            <p className="text-xs text-muted-foreground">
              Ranked by recency, importance, and activity signals
            </p>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading memory...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No memory items yet.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <article className="rounded-md border px-3 py-2" key={item.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {item.memoryType}
                    </p>
                    <span className="rounded border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Embedding: {item.embeddingJob?.status ?? 'not_started'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{item.summary}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Rank: {item.rankScore?.toFixed(2) ?? 'n/a'} | Importance:{' '}
                    {item.importanceScore ?? 'n/a'} | {new Date(item.createdAt).toLocaleString()}
                  </p>
                  {item.references ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Refs - sources: {item.references.sourceIds.length}, messages:{' '}
                      {item.references.messageIds.length}, linked memories:{' '}
                      {item.references.relatedMemoryIds.length}
                    </p>
                  ) : null}
                  {item.relatedItems?.length ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Related
                      </p>
                      {item.relatedItems.map((related) => (
                        <p
                          className="text-xs text-muted-foreground"
                          key={`${item.id}-${related.memoryItemId}`}
                        >
                          {related.memoryItemId} ({related.score.toFixed(2)}) - {related.reason}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3">
                    <button
                      className={buttonPrimaryClass}
                      disabled={
                        queueingItemId === item.id || item.embeddingJob?.status === 'queued'
                      }
                      onClick={() => {
                        void queueEmbedding(item.id);
                      }}
                      type="button"
                    >
                      {queueingItemId === item.id ? 'Queueing...' : 'Queue Embedding'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
