import { liveContextPreflightResponse, withLiveContextCors } from '@/lib/live-context/cors';

export type FasterFlowChatAliasBody = {
  url?: unknown;
  title?: unknown;
  pageText?: unknown;
  fullPageContext?: unknown;
  activeHoverContext?: unknown;
  hoverContext?: unknown;
  capturedAt?: unknown;
  userQuery?: unknown;
  message?: unknown;
  model?: unknown;
  activeModel?: unknown;
};

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function textFromUnknown(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (!value || typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;
  return (
    asTrimmedString(record.pageText) ||
    asTrimmedString(record.localText) ||
    asTrimmedString(record.surroundingText) ||
    asTrimmedString(record.text) ||
    asTrimmedString(record.content) ||
    asTrimmedString(record.activeHoverContext)
  );
}

function metaFromUnknown(value: unknown): { url: string; title: string } {
  if (!value || typeof value !== 'object') {
    return { url: '', title: '' };
  }
  const record = value as Record<string, unknown>;
  return {
    url: asTrimmedString(record.url),
    title: asTrimmedString(record.title),
  };
}

/**
 * Map FasterFlow-style chat bodies onto Aproko live-context fields.
 * Canonical Aproko bodies pass through unchanged.
 */
export function normalizeFasterFlowChatBody(
  raw: FasterFlowChatAliasBody | null,
): Record<string, unknown> {
  const input = raw && typeof raw === 'object' ? raw : {};
  const pageMeta = metaFromUnknown(input.fullPageContext);
  const hoverText =
    textFromUnknown(input.activeHoverContext) || textFromUnknown(input.hoverContext);

  return {
    url: asTrimmedString(input.url) || pageMeta.url || 'https://unknown.local',
    title: asTrimmedString(input.title) || pageMeta.title || 'Untitled page',
    pageText: asTrimmedString(input.pageText) || textFromUnknown(input.fullPageContext),
    fullPageContext: input.fullPageContext,
    activeHoverContext: hoverText,
    hoverContext: input.hoverContext,
    capturedAt: asTrimmedString(input.capturedAt) || new Date().toISOString(),
    userQuery: asTrimmedString(input.userQuery) || asTrimmedString(input.message),
    model: asTrimmedString(input.model) || asTrimmedString(input.activeModel) || undefined,
  };
}

type AliasDependencies = {
  forward: (request: Request) => Promise<Response>;
};

export function createFasterFlowChatAliasHandlers(deps: AliasDependencies) {
  return {
    OPTIONS: async (request: Request) => liveContextPreflightResponse(request),

    POST: async (request: Request) => {
      const respond = (response: Response) => withLiveContextCors(response, request);
      const raw = (await request.json().catch(() => null)) as FasterFlowChatAliasBody | null;
      const body = normalizeFasterFlowChatBody(raw);

      const headers = new Headers();
      headers.set('content-type', 'application/json');
      const authorization = request.headers.get('authorization');
      const cookie = request.headers.get('cookie');
      const origin = request.headers.get('origin');
      if (authorization) {
        headers.set('authorization', authorization);
      }
      if (cookie) {
        headers.set('cookie', cookie);
      }
      if (origin) {
        headers.set('origin', origin);
      }

      const forwarded = new Request(request.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      return respond(await deps.forward(forwarded));
    },
  };
}
