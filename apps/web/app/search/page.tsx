'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
            className="block rounded-md border p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <Card>
          <CardHeader>
            <CardTitle>Workspace Search</CardTitle>
            <CardDescription>Query sources, notes, and memory in one place.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <Input
                aria-label="Search workspace content"
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
              <Button disabled={isLoading} onClick={() => void handleSearch()} type="button">
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <button
                  aria-pressed={activeFilter === filter.value}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    activeFilter === filter.value
                      ? 'bg-foreground text-background'
                      : 'hover:bg-muted/70'
                  }`}
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
            {error ? (
              <div
                className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent aria-live="polite" className="pt-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground" role="status">
                Loading search results...
              </p>
            ) : results.length === 0 ? (
              <div className="rounded-md border border-dashed bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">
                  No results yet. Run a query to search your workspace context.
                </p>
              </div>
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
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
