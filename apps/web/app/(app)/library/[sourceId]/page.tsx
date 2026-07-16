import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { AppPageShell } from '@/components/app/app-page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLibrarySignedUrl, getLibrarySource } from '@/lib/storage/library';
import { resolveWorkspaceForUser } from '@/lib/storage/workspaces';

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

  const workspace = await resolveWorkspaceForUser(userId);
  if (!workspace) {
    return (
      <main className="p-6">
        <p className="text-sm text-destructive">Failed to resolve workspace.</p>
      </main>
    );
  }

  const { sourceId } = await params;
  const source = await getLibrarySource(workspace.workspaceId, sourceId);

  if (!source) {
    return (
      <AppPageShell
        headerAction={
          <Button asChild size="sm" variant="outline">
            <Link href="/library">Back to library</Link>
          </Button>
        }
        pageId="librarySource"
        subtitle="This document could not be found."
        title="Source not found"
      >
        <p className="text-sm text-destructive">Source not found.</p>
      </AppPageShell>
    );
  }

  const signedUrl = await getLibrarySignedUrl(source.objectPath, 3600);
  const isImage = source.mimeType?.startsWith('image/') ?? false;

  return (
    <AppPageShell
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/library">Back to library</Link>
          </Button>
          <Button asChild size="sm">
            <Link
              href={`/chat?new=1&sourceId=${encodeURIComponent(source.id)}&sourceName=${encodeURIComponent(source.name)}`}
            >
              Ask about this
            </Link>
          </Button>
        </div>
      }
      pageId="librarySource"
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
    </AppPageShell>
  );
}
