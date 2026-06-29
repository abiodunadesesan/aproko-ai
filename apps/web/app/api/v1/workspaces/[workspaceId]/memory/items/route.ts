import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createMemoryItem,
  listMemoryItems,
  type MemoryItem,
  type MemoryReferences,
  type MemoryType,
} from '@/lib/storage/memory';

type AuthDependency = () => Promise<{ userId: string | null }>;

type MemoryItemsRouteDependencies = {
  auth: AuthDependency;
  listMemoryItems: typeof listMemoryItems;
  createMemoryItem: typeof createMemoryItem;
};

type RouteContext = { params: Promise<{ workspaceId: string }> };
type MemorySortMode = 'ranked' | 'created';

const memoryTypes: MemoryType[] = [
  'fact',
  'preference',
  'project',
  'decision',
  'task',
  'timeline_event',
];

function toMemoryItemPayload(
  item: MemoryItem,
  rankScore?: number,
  relatedItems?: Array<{ memoryItemId: string; score: number; reason: string }>,
) {
  return {
    id: item.id,
    workspaceId: item.workspaceId,
    memoryType: item.memoryType,
    summary: item.summary,
    importanceScore: item.importanceScore,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    ...(typeof rankScore === 'number' ? { rankScore } : {}),
    ...(item.references ? { references: item.references } : {}),
    ...(relatedItems?.length ? { relatedItems } : {}),
    ...(item.embeddingJob ? { embeddingJob: item.embeddingJob } : {}),
  };
}

function isMemoryType(value: string): value is MemoryType {
  return memoryTypes.includes(value as MemoryType);
}

function parseSortMode(url: string): MemorySortMode {
  const sort = new URL(url).searchParams.get('sort');
  return sort === 'created' ? 'created' : 'ranked';
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === 'string');
}

function tokenizeSummary(summary: string): Set<string> {
  return new Set(
    summary
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2),
  );
}

function setOverlap<T>(left: Set<T>, right: Set<T>): number {
  let overlap = 0;
  for (const value of left) {
    if (right.has(value)) {
      overlap += 1;
    }
  }
  return overlap;
}

function deriveRelatedItems(
  items: MemoryItem[],
): Record<string, Array<{ memoryItemId: string; score: number; reason: string }>> {
  const tokenMap = new Map<string, Set<string>>();
  for (const item of items) {
    tokenMap.set(item.id, tokenizeSummary(item.summary));
  }

  const output: Record<string, Array<{ memoryItemId: string; score: number; reason: string }>> = {};

  for (const current of items) {
    const related: Array<{ memoryItemId: string; score: number; reason: string }> = [];
    const currentTokens = tokenMap.get(current.id) ?? new Set<string>();

    for (const candidate of items) {
      if (candidate.id === current.id) {
        continue;
      }

      const candidateTokens = tokenMap.get(candidate.id) ?? new Set<string>();
      const lexicalOverlap = setOverlap(currentTokens, candidateTokens);
      const explicitLink = current.references?.relatedMemoryIds.includes(candidate.id) ?? false;
      const sharedSource =
        (current.references?.sourceIds.some((sourceId) =>
          candidate.references?.sourceIds.includes(sourceId),
        ) ??
          false) ||
        false;
      const sharedMessage =
        (current.references?.messageIds.some((messageId) =>
          candidate.references?.messageIds.includes(messageId),
        ) ??
          false) ||
        false;

      const score =
        lexicalOverlap * 0.12 +
        (explicitLink ? 0.4 : 0) +
        (sharedSource ? 0.25 : 0) +
        (sharedMessage ? 0.2 : 0);
      if (score <= 0) {
        continue;
      }

      let reason = 'lexical similarity';
      if (explicitLink) {
        reason = 'explicit memory link';
      } else if (sharedSource) {
        reason = 'shared source reference';
      } else if (sharedMessage) {
        reason = 'shared message reference';
      }

      related.push({
        memoryItemId: candidate.id,
        score: Number(Math.min(1, score).toFixed(4)),
        reason,
      });
    }

    output[current.id] = related.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  return output;
}

function recencyScore(timestamp: string, nowMs: number): number {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  const ageHours = Math.max(0, (nowMs - parsed) / 3_600_000);
  // Exponential decay gives smoother timeline ranking than hard cutoffs.
  return Math.exp(-ageHours / 72);
}

function embeddingSignal(status: string): number {
  switch (status) {
    case 'completed':
      return 1;
    case 'processing':
      return 0.8;
    case 'queued':
      return 0.6;
    case 'failed':
      return 0.2;
    default:
      return 0.5;
  }
}

function computeRankScore(item: MemoryItem, nowMs: number): number {
  const importance = item.importanceScore ?? 0.5;
  const createdRecency = recencyScore(item.createdAt, nowMs);
  const activityRecency = recencyScore(item.updatedAt, nowMs);
  const statusSignal = embeddingSignal(item.embeddingJob?.status ?? 'not_started');
  const raw =
    0.45 * importance + 0.3 * createdRecency + 0.2 * activityRecency + 0.05 * statusSignal;
  return Math.max(0, Math.min(1, Number(raw.toFixed(4))));
}

function rankMemoryTimeline(
  items: MemoryItem[],
  sortMode: MemorySortMode,
): Array<{ item: MemoryItem; rankScore: number }> {
  const nowMs = Date.now();
  const ranked = items.map((item) => ({ item, rankScore: computeRankScore(item, nowMs) }));

  if (sortMode === 'created') {
    return ranked.sort((a, b) => Date.parse(b.item.createdAt) - Date.parse(a.item.createdAt));
  }

  return ranked.sort(
    (a, b) =>
      b.rankScore - a.rankScore || Date.parse(b.item.createdAt) - Date.parse(a.item.createdAt),
  );
}

export function createMemoryItemsRouteHandlers(deps: MemoryItemsRouteDependencies) {
  return {
    GET: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId } = await context.params;
      const items = await deps.listMemoryItems(workspaceId);
      const sortMode = parseSortMode(request.url);
      const ranked = rankMemoryTimeline(items, sortMode);
      const relatedMap = deriveRelatedItems(items);
      return NextResponse.json({
        data: ranked.map((entry) =>
          toMemoryItemPayload(entry.item, entry.rankScore, relatedMap[entry.item.id]),
        ),
      });
    },

    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId } = await context.params;
      const rawBody = (await request.json().catch(() => null)) as {
        memoryType?: string;
        summary?: string;
        importanceScore?: number | null;
        sourceIds?: string[];
        messageIds?: string[];
        relatedMemoryIds?: string[];
      } | null;

      const memoryType = rawBody?.memoryType?.trim() ?? '';
      const summary = rawBody?.summary?.trim() ?? '';
      const importanceScore = rawBody?.importanceScore ?? null;
      const references: MemoryReferences = {
        sourceIds: parseStringArray(rawBody?.sourceIds),
        messageIds: parseStringArray(rawBody?.messageIds),
        relatedMemoryIds: parseStringArray(rawBody?.relatedMemoryIds),
      };

      if (!isMemoryType(memoryType)) {
        return NextResponse.json({ error: 'Invalid memory type' }, { status: 400 });
      }

      if (!summary) {
        return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
      }

      if (importanceScore !== null && (importanceScore < 0 || importanceScore > 1)) {
        return NextResponse.json(
          { error: 'importanceScore must be between 0 and 1' },
          { status: 400 },
        );
      }

      const item = await deps.createMemoryItem(
        workspaceId,
        memoryType,
        summary,
        importanceScore,
        references,
      );
      if (!item) {
        return NextResponse.json({ error: 'Failed to create memory item' }, { status: 500 });
      }

      return NextResponse.json({ data: toMemoryItemPayload(item) }, { status: 201 });
    },
  };
}

export const { GET, POST } = createMemoryItemsRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listMemoryItems,
  createMemoryItem,
});
