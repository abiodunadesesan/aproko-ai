import { isExtensionEmbedFrame } from '@/lib/extension/embed-frame';

export function extensionAuthHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token) {
    // Custom header avoids Clerk middleware treating handoff tokens as Clerk JWTs.
    headers['X-Aproko-Extension-Token'] = token;
  }
  return headers;
}

/** Flat extension chat endpoint — resolves workspace from bearer/cookies server-side. */
export const EXTENSION_LIVE_CONTEXT_CHAT_PATH = '/api/v1/extension/live-context/chat';

export function workspaceLiveContextChatPath(workspaceId: string): string {
  return `/api/v1/workspaces/${workspaceId}/live-context/chat`;
}

export type ExtensionSessionPayload = {
  workspaceId: string;
  name: string | null;
  role: string | null;
  planCode?: string;
  liveContextCompanion?: boolean;
};

function isExtensionPanelOrigin(origin: string, pageOrigin: string): boolean {
  return (
    origin === pageOrigin ||
    origin.startsWith('chrome-extension://') ||
    origin.startsWith('safari-web-extension://') ||
    origin.startsWith('safari-extension://')
  );
}

/** Safari popup iframes often cannot validate handoff tokens via direct fetch — proxy through the extension. */
function fetchExtensionSessionViaProxy(token: string): Promise<ExtensionSessionPayload | null> {
  return new Promise((resolve) => {
    const requestId = crypto.randomUUID();
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', onMessage);
      resolve(null);
    }, 20_000);

    function onMessage(event: MessageEvent) {
      if (!isExtensionPanelOrigin(event.origin, window.location.origin)) {
        return;
      }
      if (
        event.data?.type !== 'APROKO_PROXY_EXTENSION_SESSION_RESULT' ||
        event.data.requestId !== requestId
      ) {
        return;
      }

      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);

      if (!event.data.ok || !event.data.session?.workspaceId) {
        resolve(null);
        return;
      }

      const result: ExtensionSessionPayload = {
        workspaceId: event.data.session.workspaceId,
        name: event.data.session.name ?? null,
        role: event.data.session.role ?? null,
      };
      if (event.data.session.planCode !== undefined) {
        result.planCode = event.data.session.planCode;
      }
      if (event.data.session.liveContextCompanion !== undefined) {
        result.liveContextCompanion = event.data.session.liveContextCompanion;
      }
      resolve(result);
    }

    window.addEventListener('message', onMessage);
    window.parent.postMessage(
      {
        type: 'APROKO_PROXY_EXTENSION_SESSION',
        requestId,
        token,
      },
      '*',
    );
  });
}

export async function fetchExtensionSession(token: string): Promise<ExtensionSessionPayload | null> {
  if (typeof window !== 'undefined' && isExtensionEmbedFrame()) {
    return fetchExtensionSessionViaProxy(token);
  }

  const response = await fetch('/api/v1/extension/session', {
    headers: {
      ...extensionAuthHeaders(token),
      Accept: 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => null)) as {
    data?: {
      workspaceId?: string;
      name?: string;
      role?: string;
      planCode?: string;
      liveContextCompanion?: boolean;
    };
    error?: string;
  };

  if (!response.ok || !payload.data?.workspaceId) {
    return null;
  }

  const result: ExtensionSessionPayload = {
    workspaceId: payload.data.workspaceId,
    name: payload.data.name ?? null,
    role: payload.data.role ?? null,
  };
  if (payload.data.planCode !== undefined) {
    result.planCode = payload.data.planCode;
  }
  if (payload.data.liveContextCompanion !== undefined) {
    result.liveContextCompanion = payload.data.liveContextCompanion;
  }
  return result;
}
