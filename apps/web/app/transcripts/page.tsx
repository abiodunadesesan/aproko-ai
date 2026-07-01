'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Mic, Upload } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import { appPageMeta } from '@/lib/navigation/app-pages';
import { EmptyState } from '@/components/app/empty-state';
import { TableSkeleton } from '@/components/app/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const WORKSPACE_ID = 'default-workspace';

type TranscriptSource = {
  id: string;
  name: string;
  project: string;
  folder: string;
  size: number;
  updatedAt: string | null;
  sourceType?: string | null;
};

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isThisMonth(isoDate: string | null): boolean {
  if (!isoDate) {
    return false;
  }
  const date = new Date(isoDate);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState<TranscriptSource[]>([]);
  const [query, setQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTranscripts() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/transcripts`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as { data?: TranscriptSource[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load transcripts');
      }
      setTranscripts(payload.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load transcripts');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTranscripts();
  }, []);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return transcripts;
    }
    return transcripts.filter((item) => item.name.toLowerCase().includes(trimmed));
  }, [query, transcripts]);

  const thisMonthCount = useMemo(
    () => transcripts.filter((item) => isThisMonth(item.updatedAt)).length,
    [transcripts],
  );

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project', 'transcripts');
      formData.append('folder', 'uploads');

      const response = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/sources`, {
        method: 'POST',
        body: formData,
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to upload transcript');
      }

      setFile(null);
      await loadTranscripts();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload transcript');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <AppPageShell headerBadge={`${transcripts.length} files`} meta={appPageMeta.transcripts}>
      <section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
                {isLoading ? '—' : transcripts.length}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">All transcript files</p>
            </CardContent>
          </Card>
          <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                This month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
                {isLoading ? '—' : thisMonthCount}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Recently added</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
          <CardHeader>
            <CardTitle className="text-base">Upload transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={handleUpload}
            >
              <Input
                accept=".txt,.md,.markdown,.vtt,.srt,audio/*"
                aria-label="Choose transcript file"
                className="max-w-xl"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <Button className="rounded-full" disabled={!file || isUploading} type="submit">
                <Upload className="mr-1.5 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </form>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Supported: .txt, .md, .vtt, .srt, and audio files (max 25MB).
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All transcripts</CardTitle>
            <Input
              aria-label="Search transcripts"
              className="max-w-xs"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transcripts..."
              value={query}
            />
          </CardHeader>
          <CardContent>
            {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : filtered.length === 0 ? (
              <EmptyState
                action={
                  <Button asChild className="rounded-full" variant="outline">
                    <Link href="/chat">Open AI Chat</Link>
                  </Button>
                }
                description="Upload a transcript file above or add .txt/.vtt files to your transcripts folder in Documents."
                icon={Mic}
                title={query.trim() ? 'No matching transcripts' : 'No transcripts yet'}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link
                          className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                          href={`/library/${item.id}`}
                        >
                          {item.name}
                        </Link>
                      </TableCell>
                      <TableCell className="capitalize text-zinc-600 dark:text-zinc-400">
                        {item.sourceType ?? 'transcript'}
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-400">
                        {formatBytes(item.size)}
                      </TableCell>
                      <TableCell className="text-right text-zinc-600 dark:text-zinc-400">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </AppPageShell>
  );
}
