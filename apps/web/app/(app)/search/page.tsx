'use client';

import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { AppPageShell } from '@/components/app/app-page-shell';
import { AppReveal } from '@/components/app/app-motion';
import {
  AppFilterChip,
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  appSurface,
} from '@/components/app/app-surface';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SearchResult = {
  id: string;
  type: 'source' | 'note' | 'memory';
  title: string;
  snippet: string;
};

type SearchTypeFilter = 'all' | 'source' | 'note' | 'memory';

const FILTERS: Array<{ label: string; value: SearchTypeFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Sources', value: 'source' },
  { label: 'Notes', value: 'note' },
  { label: 'Memory', value: 'memory' },
];

function formatResultType(type: SearchResult['type']): string {
  if (type === 'source') return 'Source';
  if (type === 'note') return 'Note';
  return 'Memory';
}

function toResultHref(result: SearchResult): string {
  if (result.type === 'source') {
    return `/library/${result.id}`;
  }
  if (result.type === 'note') {
    return '/study';
  }
  return '/memory';
}

export default function SearchPage() {
  const { workspaceId, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeFilter, setActiveFilter] = useState<SearchTypeFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) {
      setError('Enter a search query.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const encoded = encodeURIComponent(query.trim());
      const res = await fetch(
        `/api/v1/workspaces/${workspaceId}/search?q=${encoded}&type=${activeFilter}&limit=30`,
        {
          cache: 'no-store',
        },
      );
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to search workspace');
      }

      setResults((payload.data ?? []) as SearchResult[]);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search workspace');
    } finally {
      setIsLoading(false);
    }
  }

  const grouped = {
    source: results.filter((result) => result.type === 'source'),
    note: results.filter((result) => result.type === 'note'),
    memory: results.filter((result) => result.type === 'memory'),
  };

  function renderResultList(items: SearchResult[]) {
    return (
      <div className="space-y-2">
        {items.map((result) => (
          <Link
            className={appSurface.linkRow}
            href={toResultHref(result)}
            key={`${result.type}-${result.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{result.title}</p>
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {formatResultType(result.type)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {result.snippet}
            </p>
          </Link>
        ))}
      </div>
    );
  }

  if (isWorkspaceLoading || !workspaceId) {
    return (
      <AppPageShell pageId="search">
        <p className="text-sm text-muted-foreground" role="status">
          {workspaceError ?? 'Resolving workspace…'}
        </p>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell pageId="search">
      <AppPageFrame>
        <AppReveal>
          <AppPanel>
            <AppPanelBody className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  aria-label="Search workspace content"
                  className={cn(appSurface.field, 'h-11')}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleSearch();
                    }
                  }}
                  placeholder="Search sources, notes, memory…"
                  value={query}
                />
                <Button
                  className="h-11 w-full rounded-full sm:w-auto"
                  disabled={isLoading}
                  onClick={() => void handleSearch()}
                  type="button"
                >
                  {isLoading ? 'Searching…' : 'Search'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                  <AppFilterChip
                    active={activeFilter === filter.value}
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                  >
                    {filter.label}
                  </AppFilterChip>
                ))}
              </div>
              {error ? (
                <div className={appSurface.alert} role="alert">
                  {error}
                </div>
              ) : null}
            </AppPanelBody>
          </AppPanel>
        </AppReveal>

        <AppReveal delay={0.05}>
        <AppPanel>
          <div aria-live="polite">
            <AppPanelBody>
              {isLoading ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
                  Loading search results...
                </p>
              ) : !hasSearched ? (
                <EmptyState
                  compact
                  description="Enter a query above to find sources, study notes, and remembered facts across your workspace."
                  icon={SearchIcon}
                  title="Search your workspace"
                />
              ) : results.length === 0 ? (
                <EmptyState
                  compact
                  description={`No matches for "${query.trim()}". Try different keywords or broaden your filter.`}
                  icon={SearchIcon}
                  title="No results found"
                />
              ) : activeFilter === 'all' ? (
                <div className="space-y-5">
                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Sources ({grouped.source.length})
                    </p>
                    {grouped.source.length > 0 ? (
                      renderResultList(grouped.source)
                    ) : (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">No source matches.</p>
                    )}
                  </section>
                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Notes ({grouped.note.length})
                    </p>
                    {grouped.note.length > 0 ? (
                      renderResultList(grouped.note)
                    ) : (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">No note matches.</p>
                    )}
                  </section>
                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Memory ({grouped.memory.length})
                    </p>
                    {grouped.memory.length > 0 ? (
                      renderResultList(grouped.memory)
                    ) : (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">No memory matches.</p>
                    )}
                  </section>
                </div>
              ) : (
                renderResultList(results)
              )}
            </AppPanelBody>
          </div>
        </AppPanel>
        </AppReveal>
      </AppPageFrame>
    </AppPageShell>
  );
}
