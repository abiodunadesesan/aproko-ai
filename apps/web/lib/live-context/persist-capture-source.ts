import { uploadLibraryFile } from '@/lib/storage/library';
import type { SanitizedLiveBrowserContext } from '@/lib/live-context/sanitize';

const LIVE_CAPTURE_PROJECT = 'general';
const LIVE_CAPTURE_FOLDER = 'live-context';

export type PersistedLiveCaptureSource = {
  sourceId: string;
  name: string;
};

function buildCaptureFileName(title: string): string {
  const safeTitle = title.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80) || 'capture';
  return `${safeTitle}-${Date.now()}.txt`;
}

function buildCaptureFileBody(
  context: Pick<SanitizedLiveBrowserContext, 'url' | 'title' | 'pageText' | 'capturedAt'>,
): string {
  return [
    'Aproko Live Context capture',
    `URL: ${context.url}`,
    `Title: ${context.title}`,
    `Captured: ${context.capturedAt}`,
    '',
    '---',
    '',
    context.pageText,
  ].join('\n');
}

/** Persist sanitized page text as a library `.txt` source (live-context folder). */
export async function persistLiveCaptureAsSource(
  workspaceId: string,
  context: Pick<SanitizedLiveBrowserContext, 'url' | 'title' | 'pageText' | 'capturedAt'>,
): Promise<PersistedLiveCaptureSource | null> {
  try {
    const fileName = buildCaptureFileName(context.title);
    const file = new File([buildCaptureFileBody(context)], fileName, { type: 'text/plain' });
    const result = await uploadLibraryFile(
      workspaceId,
      file,
      LIVE_CAPTURE_PROJECT,
      LIVE_CAPTURE_FOLDER,
    );
    return { sourceId: result.source.id, name: result.source.name };
  } catch (error) {
    console.warn('[live-context] persist capture failed', error);
    return null;
  }
}
