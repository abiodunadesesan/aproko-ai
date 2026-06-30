import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
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
      <main className="space-y-4 p-6">
        <p className="text-sm text-destructive">Source not found.</p>
        <Link className="text-sm underline" href="/library">
          Back to library
        </Link>
      </main>
    );
  }

  const signedUrl = await getLibrarySignedUrl(source.objectPath, 3600);
  const isImage = source.mimeType?.startsWith('image/') ?? false;

  return (
    <main className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{source.name}</h1>
        <p className="text-sm text-muted-foreground">
          Project: {source.project} | Folder: {source.folder}
        </p>
        <Link className="text-sm underline underline-offset-4" href="/library">
          Back to library
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {signedUrl ? (
            isImage ? (
              <img
                alt={source.name}
                className="max-h-[560px] w-auto rounded-md border"
                src={signedUrl}
              />
            ) : (
              <a
                aria-label={`Open ${source.name} in a new tab`}
                className="text-sm underline underline-offset-4 transition-colors hover:text-foreground/80"
                href={signedUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open file
              </a>
            )
          ) : (
            <div className="rounded-md border border-dashed bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                File preview unavailable. Check storage configuration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
