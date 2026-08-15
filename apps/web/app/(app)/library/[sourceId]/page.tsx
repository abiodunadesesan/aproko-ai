import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { ExternalLink, FileText } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
  appSurface,
} from '@/components/app/app-surface';
import { Button } from '@/components/ui/button';
import { getLibrarySignedUrl, getLibrarySource } from '@/lib/storage/library';
import { resolveWorkspaceForUser } from '@/lib/storage/workspaces';
import { cn } from '@/lib/utils';

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
          <Button asChild className="rounded-xl" size="sm" variant="outline">
            <Link href="/library">Back to library</Link>
          </Button>
        }
        pageId="librarySource"
        subtitle="This document could not be found."
        title="Source not found"
      >
        <AppPageFrame>
          <p className={appSurface.alert}>Source not found.</p>
        </AppPageFrame>
      </AppPageShell>
    );
  }

  const signedUrl = await getLibrarySignedUrl(source.objectPath, 3600);
  const isImage = source.mimeType?.startsWith('image/') ?? false;

  return (
    <AppPageShell
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="rounded-xl" size="sm" variant="outline">
            <Link href="/library">Back to library</Link>
          </Button>
          <Button asChild className="rounded-xl" size="sm">
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
      <AppPageFrame>
        <AppPanel>
          <AppPanelHeader
            action={
              signedUrl ? (
                <Button asChild className="rounded-xl" size="sm" variant="outline">
                  <a href={signedUrl} rel="noreferrer" target="_blank">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Open file
                  </a>
                </Button>
              ) : null
            }
            description={
              source.mimeType
                ? `${source.mimeType}${isImage ? ' · Image preview' : ' · File preview'}`
                : 'Source preview'
            }
            title="Preview"
          />
          <AppPanelBody>
            {signedUrl ? (
              isImage ? (
                <div
                  className={cn(
                    appSurface.inset,
                    'flex min-h-[240px] items-center justify-center overflow-hidden p-3 sm:min-h-[360px] sm:p-5',
                  )}
                >
                  <img
                    alt={source.name}
                    className="max-h-[min(70vh,640px)] w-auto max-w-full rounded-xl object-contain"
                    src={signedUrl}
                  />
                </div>
              ) : (
                <div
                  className={cn(
                    appSurface.inset,
                    'flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between',
                  )}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200/90 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                      <FileText className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {source.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Preview opens in a new tab. Ask about this source from chat when indexed.
                      </p>
                    </div>
                  </div>
                  <Button asChild className="w-full rounded-xl sm:w-auto" size="sm">
                    <a href={signedUrl} rel="noreferrer" target="_blank">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Open file
                    </a>
                  </Button>
                </div>
              )
            ) : (
              <div
                className={cn(
                  appSurface.inset,
                  'border-dashed p-5 text-sm text-zinc-600 dark:text-zinc-400',
                )}
              >
                File preview unavailable. Check storage configuration.
              </div>
            )}
          </AppPanelBody>
        </AppPanel>
      </AppPageFrame>
    </AppPageShell>
  );
}
