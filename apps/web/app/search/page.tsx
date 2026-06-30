'use client';

import Link from 'next/link';
import { useState } from 'react';
import { buttonPrimaryClass, cardClass } from '@aproko/ui';
import { AppShell } from '@/components/app-shell';

type SearchResult = {
  id: string;
  type: 'source' | 'note' | 'memory';
  title: string;
  snippet: string;
};

type SearchTypeFilter = 'all' | 'source' | 'note' | 'memory';

const WORKSPACE_ID = 'default-workspace';
const FILTERS: Array<{ label: string; value: SearchTypeFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Sources', value: 'source' },
  { label: 'Notes', value: 'note' },
  { label: 'Memory', value: 'memory' },
];

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeFilter, setActiveFilter] = useState<SearchTypeFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
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
        `/api/v1/workspaces/${WORKSPACE_ID}/search?q=${encoded}&type=${activeFilter}&limit=30`,
        {
          cache: 'no-store',
        },
      );
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to search workspace');
      }

      setResults((payload.data ?? []) as SearchResult[]);
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
            className="block rounded-md border p-3 hover:bg-muted"
            href={toResultHref(result)}
            key={`${result.type}-${result.id}`}
          >
            <p className="text-sm font-medium">{result.title}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
              {result.type}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{result.snippet}</p>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <AppShell
      subtitle="Search across your workspace sources, notes, and memory items."
      title="Search"
    >
      <section className="space-y-4">
        <div className={cardClass}>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <input
              className="h-10 rounded-md border px-3 text-sm"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleSearch();
                }
              }}
              placeholder="Search notes, sources, memory..."
              value={query}
            />
            <button
              className={buttonPrimaryClass}
              disabled={isLoading}
              onClick={() => void handleSearch()}
              type="button"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                className={`rounded-full border px-3 py-1 text-xs ${
                  activeFilter === filter.value ? 'bg-foreground text-background' : 'hover:bg-muted'
                }`}
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </div>

        <div className={cardClass}>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading search results...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No results yet. Run a query to search your workspace context.
            </p>
          ) : activeFilter === 'all' ? (
            <div className="space-y-4">
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sources ({grouped.source.length})
                </p>
                {grouped.source.length > 0 ? (
                  renderResultList(grouped.source)
                ) : (
                  <p className="text-sm text-muted-foreground">No source matches.</p>
                )}
              </section>
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes ({grouped.note.length})
                </p>
                {grouped.note.length > 0 ? (
                  renderResultList(grouped.note)
                ) : (
                  <p className="text-sm text-muted-foreground">No note matches.</p>
                )}
              </section>
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Memory ({grouped.memory.length})
                </p>
                {grouped.memory.length > 0 ? (
                  renderResultList(grouped.memory)
                ) : (
                  <p className="text-sm text-muted-foreground">No memory matches.</p>
                )}
              </section>
            </div>
          ) : (
            renderResultList(results)
          )}
        </div>
      </section>
    </AppShell>
  );
}
