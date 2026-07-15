import type { MemoryItem } from '@/lib/storage/memory';
import { listTranscriptSources, readLibrarySourceText } from '@/lib/storage/library';
import { searchWorkspace } from '@/lib/storage/search';

export type ChatCitation = {
  id: string;
  title: string;
  snippet: string;
  sourceType: 'workspace-source' | 'note' | 'memory' | 'transcript';
};

export type ChatMemoryContext = {
  memoryItemId: string;
  memoryType: MemoryItem['memoryType'];
  summary: string;
  rankScore: number;
};

export type WorkspaceContextItem = {
  id: string;
  title: string;
  snippet: string;
  type: string;
};

function memoryRecencyScore(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  const ageHours = Math.max(0, (Date.now() - parsed) / 3_600_000);
  return Math.exp(-ageHours / 72);
}

export function selectMemoryContext(items: MemoryItem[]): ChatMemoryContext[] {
  return items
    .map((item) => {
      const importance = item.importanceScore ?? 0.5;
      const recency = memoryRecencyScore(item.updatedAt);
      const rankScore = Number((importance * 0.6 + recency * 0.4).toFixed(4));
      return {
        memoryItemId: item.id,
        memoryType: item.memoryType,
        summary: item.summary,
        rankScore,
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 5);
}

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .slice(0, 8);
}

function bestExcerpt(content: string, query: string, limit = 420): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  const tokens = tokenizeQuery(query);
  const lower = normalized.toLowerCase();
  let bestIndex = 0;
  let bestScore = -1;

  for (const token of tokens) {
    const index = lower.indexOf(token);
    if (index >= 0 && (bestScore < 0 || index < bestScore)) {
      bestScore = index;
      bestIndex = Math.max(0, index - 80);
    }
  }

  const excerpt = normalized.slice(bestIndex, bestIndex + limit);
  return bestIndex > 0 ? `…${excerpt}` : excerpt;
}

async function hydrateSourceSnippets(
  workspaceId: string,
  items: WorkspaceContextItem[],
  query: string,
): Promise<WorkspaceContextItem[]> {
  const hydrated = await Promise.all(
    items.map(async (item) => {
      if (item.type !== 'source' && item.type !== 'transcript') {
        return item;
      }

      try {
        const source = await readLibrarySourceText(workspaceId, item.id);
        if (!source?.content) {
          return item;
        }
        return {
          ...item,
          type: item.title.toLowerCase().includes('transcript') ? 'transcript' : item.type,
          snippet: bestExcerpt(source.content, query) || item.snippet,
        };
      } catch {
        return item;
      }
    }),
  );

  return hydrated;
}

async function supplementWithRecentTranscripts(
  workspaceId: string,
  existing: WorkspaceContextItem[],
  query: string,
): Promise<WorkspaceContextItem[]> {
  if (existing.some((item) => item.type === 'source' || item.type === 'transcript')) {
    return existing;
  }

  const transcripts = await listTranscriptSources(workspaceId);
  const textTranscripts = transcripts
    .filter((item) => {
      const name = item.name.toLowerCase();
      return (
        name.endsWith('.txt') ||
        name.endsWith('.md') ||
        name.endsWith('.vtt') ||
        name.endsWith('.srt') ||
        item.sourceType === 'transcript' ||
        item.sourceType === 'txt' ||
        item.sourceType === 'markdown'
      );
    })
    .slice(0, 3);

  const supplements: WorkspaceContextItem[] = [];
  for (const transcript of textTranscripts) {
    try {
      const text = await readLibrarySourceText(workspaceId, transcript.id);
      if (!text?.content) {
        continue;
      }
      supplements.push({
        id: transcript.id,
        title: transcript.name,
        snippet: bestExcerpt(text.content, query) || text.content.slice(0, 420),
        type: 'transcript',
      });
    } catch {
      continue;
    }
  }

  return [...existing, ...supplements].slice(0, 8);
}

export async function buildWorkspaceContext(
  workspaceId: string,
  query: string,
): Promise<WorkspaceContextItem[]> {
  const results = await searchWorkspace(workspaceId, query, { limit: 8 });
  const mapped: WorkspaceContextItem[] = results.map((result) => ({
    id: result.id,
    title: result.title,
    snippet: result.snippet,
    type: result.type,
  }));

  const withTranscripts = await supplementWithRecentTranscripts(workspaceId, mapped, query);
  return hydrateSourceSnippets(workspaceId, withTranscripts, query);
}

export function workspaceContextToCitations(context: WorkspaceContextItem[]): ChatCitation[] {
  return context
    .filter((item) => ['source', 'note', 'memory', 'transcript'].includes(item.type))
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      title: item.title,
      snippet: item.snippet,
      sourceType:
        item.type === 'note'
          ? ('note' as const)
          : item.type === 'memory'
            ? ('memory' as const)
            : item.type === 'transcript'
              ? ('transcript' as const)
              : ('workspace-source' as const),
    }));
}

export function buildChatSystemPrompt(input: {
  memoryContext: ChatMemoryContext[];
  workspaceContext: WorkspaceContextItem[];
}): string {
  const memoryBlock = input.memoryContext.length
    ? input.memoryContext.map((item) => `- (${item.memoryType}) ${item.summary}`).join('\n')
    : 'No memory items selected.';

  const workspaceBlock = input.workspaceContext.length
    ? input.workspaceContext
        .map((item) => `- [${item.type}] ${item.title}: ${item.snippet}`)
        .join('\n')
    : 'No matching workspace sources found.';

  return [
    'You are Aproko AI, a workspace knowledge assistant.',
    'Prefer answers grounded in the workspace context and memory below.',
    'When you use a source, paraphrase faithfully and stay consistent with its snippet.',
    'If the context does not contain enough information, say what is missing before using general knowledge.',
    'Do not invent citations or claim a source was used unless it appears in the context.',
    '',
    'Memory context:',
    memoryBlock,
    '',
    'Workspace context:',
    workspaceBlock,
  ].join('\n');
}
