import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { cardClass } from '@aproko/ui';
import { getLibrarySignedUrl, getLibrarySource } from '@/lib/storage/library';

const WORKSPACE_ID = 'default-workspace';

export default async function LibrarySourcePage({
  params
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
        <h1 className="text-2xl font-semibold">{source.name}</h1>
        <p className="text-sm text-muted-foreground">
          Project: {source.project} | Folder: {source.folder}
        </p>
        <Link className="text-sm underline" href="/library">
          Back to library
        </Link>
      </header>

      <section className={cardClass}>
        {signedUrl ? (
          isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={source.name} className="max-h-[560px] w-auto rounded-md border" src={signedUrl} />
          ) : (
            <a className="underline" href={signedUrl} rel="noreferrer" target="_blank">
              Open file
            </a>
          )
        ) : (
          <p className="text-sm text-muted-foreground">File preview unavailable. Check storage configuration.</p>
        )}
      </section>
    </main>
  );
}
