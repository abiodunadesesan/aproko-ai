import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { FileText } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLibrarySignedUrl, getLibrarySource } from '@/lib/storage/library';

const WORKSPACE_ID = 'default-workspace';

export default async function LibrarySourcePage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="p-6">
        <p className="text-sm text-destructive">Unauthorized.</p>
      </main>
    );
  }

  const { sourceId } = await params;
  const source = await getLibrarySource(WORKSPACE_ID, sourceId);

  if (!source) {
    return (
      <AppShell
        headerAction={
          <Button asChild size="sm" variant="outline">
            <Link href="/library">Back to library</Link>
          </Button>
        }
        headerIcon={FileText}
        subtitle="This document could not be found."
        title="Source not found"
      >
        <p className="text-sm text-destructive">Source not found.</p>
      </AppShell>
    );
  }

  const signedUrl = await getLibrarySignedUrl(source.objectPath, 3600);
  const isImage = source.mimeType?.startsWith('image/') ?? false;

  return (
    <AppShell
      headerAction={
        <Button asChild size="sm" variant="outline">
          <Link href="/library">Back to library</Link>
        </Button>
      }
      headerIcon={FileText}
      subtitle={`Project: ${source.project} · Folder: ${source.folder}`}
      title={source.name}
    >
      <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {signedUrl ? (
            isImage ? (
              <img
                alt={source.name}
                className="max-h-[560px] w-auto rounded-md border border-zinc-200 dark:border-zinc-800"
                src={signedUrl}
              />
            ) : (
              <a
                aria-label={`Open ${source.name} in a new tab`}
                className="text-sm font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                href={signedUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open file
              </a>
            )
          ) : (
            <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                File preview unavailable. Check storage configuration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
