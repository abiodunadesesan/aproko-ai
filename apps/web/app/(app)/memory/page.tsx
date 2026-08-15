'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { Brain } from 'lucide-react';
import Link from 'next/link';
import { AppPageShell } from '@/components/app/app-page-shell';
import {
  AppFieldLabel,
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
  appSurface,
} from '@/components/app/app-surface';
import { EmptyState } from '@/components/app/empty-state';
import { ListRowsSkeleton } from '@/components/app/list-rows-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const memoryTypes = [
  'fact',
  'preference',
  'project',
  'decision',
  'task',
  'timeline_event',
] as const;
type MemoryType = (typeof memoryTypes)[number];

type MemoryItem = {
  id: string;
  workspaceId: string;
  memoryType: MemoryType;
  summary: string;
  state: 'active' | 'archived' | 'invalidated';
  confidenceScore: number | null;
  lastReferencedAt: string | null;
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
  const { workspaceId, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace();
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [memoryType, setMemoryType] = useState<MemoryType>('fact');
  const [summary, setSummary] = useState('');
  const [importanceScore, setImportanceScore] = useState('0.60');
  const [confidenceScore, setConfidenceScore] = useState('0.70');
  const [state, setState] = useState<MemoryItem['state']>('active');
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
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/memory/items?sort=ranked`);
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
    const parsedConfidence = Number(confidenceScore);
    if (!summary.trim()) {
      setError('Summary is required');
      return;
    }

    if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 1) {
      setError('Importance score must be between 0 and 1');
      return;
    }
    if (Number.isNaN(parsedConfidence) || parsedConfidence < 0 || parsedConfidence > 1) {
      setError('Confidence score must be between 0 and 1');
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

      const response = await fetch(`/api/v1/workspaces/${workspaceId}/memory/items`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          memoryType,
          state,
          summary: summary.trim(),
          importanceScore: parsedScore,
          confidenceScore: parsedConfidence,
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
        `/api/v1/workspaces/${workspaceId}/memory/items/${itemId}/embed`,
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

  if (isWorkspaceLoading || !workspaceId) {
    return (
      <AppPageShell pageId="memory">
        <p className="text-sm text-muted-foreground" role="status">
          {workspaceError ?? 'Resolving workspace…'}
        </p>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell pageId="memory">
      <AppPageFrame>
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
          <AppPanel className="order-1 lg:sticky lg:top-4">
            <AppPanelHeader
              description="Save facts and preferences your chat can use later."
              title="Capture Memory"
            />
            <AppPanelBody>
              <form className="space-y-3.5" onSubmit={onSubmit}>
                <div className="space-y-1.5">
                  <AppFieldLabel htmlFor="memory-type">Memory Type</AppFieldLabel>
                  <Select
                    onValueChange={(value) => setMemoryType(value as MemoryType)}
                    value={memoryType}
                  >
                    <SelectTrigger className="rounded-xl" id="memory-type">
                      <SelectValue placeholder="Select memory type" />
                    </SelectTrigger>
                    <SelectContent>
                      {memoryTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <AppFieldLabel htmlFor="memory-summary">Summary</AppFieldLabel>
                  <Textarea
                    className="min-h-24 rounded-xl"
                    id="memory-summary"
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="Captured memory statement..."
                    value={summary}
                  />
                </div>

                <div className="space-y-1.5">
                  <AppFieldLabel htmlFor="memory-state">State</AppFieldLabel>
                  <Select
                    onValueChange={(value) => setState(value as MemoryItem['state'])}
                    value={state}
                  >
                    <SelectTrigger className="rounded-xl" id="memory-state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="archived">archived</SelectItem>
                      <SelectItem value="invalidated">invalidated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="space-y-1.5">
                    <AppFieldLabel htmlFor="importance-score">Importance Score (0-1)</AppFieldLabel>
                    <Input
                      aria-label="Importance score between zero and one"
                      className="rounded-xl"
                      id="importance-score"
                      inputMode="decimal"
                      onChange={(event) => setImportanceScore(event.target.value)}
                      value={importanceScore}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <AppFieldLabel htmlFor="confidence-score">Confidence Score (0-1)</AppFieldLabel>
                    <Input
                      aria-label="Confidence score between zero and one"
                      className="rounded-xl"
                      id="confidence-score"
                      inputMode="decimal"
                      onChange={(event) => setConfidenceScore(event.target.value)}
                      value={confidenceScore}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <AppFieldLabel htmlFor="source-ids">Source IDs (comma-separated)</AppFieldLabel>
                  <Input
                    className="rounded-xl"
                    id="source-ids"
                    onChange={(event) => setSourceIdsRaw(event.target.value)}
                    placeholder="src-1, src-2"
                    value={sourceIdsRaw}
                  />
                </div>

                <div className="space-y-1.5">
                  <AppFieldLabel htmlFor="message-ids">Message IDs (comma-separated)</AppFieldLabel>
                  <Input
                    className="rounded-xl"
                    id="message-ids"
                    onChange={(event) => setMessageIdsRaw(event.target.value)}
                    placeholder="msg-1, msg-2"
                    value={messageIdsRaw}
                  />
                </div>

                <div className="space-y-1.5">
                  <AppFieldLabel htmlFor="related-memory-ids">
                    Related Memory IDs (comma-separated)
                  </AppFieldLabel>
                  <Input
                    className="rounded-xl"
                    id="related-memory-ids"
                    onChange={(event) => setRelatedMemoryIdsRaw(event.target.value)}
                    placeholder="mem-3, mem-9"
                    value={relatedMemoryIdsRaw}
                  />
                </div>

                {error ? (
                  <div className={appSurface.alert} role="alert">
                    {error}
                  </div>
                ) : null}

                <Button
                  className="w-full rounded-xl transition-transform hover:-translate-y-0.5 sm:w-auto"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Saving...' : 'Save Memory'}
                </Button>
              </form>
            </AppPanelBody>
          </AppPanel>

          <AppPanel className="order-2 min-w-0" muted>
            <AppPanelHeader
              description="Ranked by recency, importance, and activity signals"
              title="Memory Timeline"
            />
            <AppPanelBody>
              <div aria-live="polite" className="space-y-3">
                {isLoading ? (
                  <ListRowsSkeleton rows={4} />
                ) : items.length === 0 ? (
                  <EmptyState
                    compact
                    action={
                      <Button asChild className="rounded-full" size="sm" variant="outline">
                        <Link href="/chat">Go to Chat</Link>
                      </Button>
                    }
                    description='Say "remember this" in chat or capture memory items from your workspace.'
                    icon={Brain}
                    title="No remembered items yet"
                  />
                ) : (
                  <div className="space-y-2.5">
                    {items.map((item) => (
                      <article
                        className={cn(
                          appSurface.inset,
                          'px-3.5 py-3 transition-colors hover:border-zinc-200 hover:bg-white/90 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70',
                        )}
                        key={item.id}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            {item.memoryType}
                          </p>
                          <span className="rounded-full border border-zinc-200/90 bg-white/80 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-400">
                            Embedding: {item.embeddingJob?.status ?? 'not_started'}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">
                          {item.summary}
                        </p>
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          Rank: {item.rankScore?.toFixed(2) ?? 'n/a'} | Importance:{' '}
                          {item.importanceScore ?? 'n/a'} | Confidence:{' '}
                          {item.confidenceScore ?? 'n/a'} | State: {item.state} |{' '}
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Last referenced:{' '}
                          {item.lastReferencedAt
                            ? new Date(item.lastReferencedAt).toLocaleString()
                            : 'not yet'}
                        </p>
                        {item.references ? (
                          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                            Refs - sources: {item.references.sourceIds.length}, messages:{' '}
                            {item.references.messageIds.length}, linked memories:{' '}
                            {item.references.relatedMemoryIds.length}
                          </p>
                        ) : null}
                        {item.relatedItems?.length ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                              Related
                            </p>
                            {item.relatedItems.map((related) => (
                              <p
                                className="text-xs text-zinc-500 dark:text-zinc-400"
                                key={`${item.id}-${related.memoryItemId}`}
                              >
                                {related.memoryItemId} ({related.score.toFixed(2)}) -{' '}
                                {related.reason}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-3">
                          <Button
                            aria-label={`Queue embedding for memory item ${item.id}`}
                            className="rounded-xl transition-transform hover:-translate-y-0.5"
                            disabled={
                              queueingItemId === item.id ||
                              item.embeddingJob?.status === 'queued'
                            }
                            onClick={() => {
                              void queueEmbedding(item.id);
                            }}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            {queueingItemId === item.id ? 'Queueing...' : 'Queue Embedding'}
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </AppPanelBody>
          </AppPanel>
        </div>
      </AppPageFrame>
    </AppPageShell>
  );
}
