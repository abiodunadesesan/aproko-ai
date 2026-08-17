import { isExtensionEmbedFrame } from '@/lib/extension/embed-frame';

function isExtensionPanelOrigin(origin: string, pageOrigin: string): boolean {
  return (
    origin === pageOrigin ||
    origin.startsWith('chrome-extension://') ||
    origin.startsWith('safari-web-extension://') ||
    origin.startsWith('safari-extension://')
  );
}

export type LiveContextChatRequestBody = {
  url: string;
  title: string;
  pageText: string;
  fullPageContext: string;
  activeHoverContext: string;
  capturedAt: string;
  userQuery: string;
};

export type ExtensionEmbedAuth = {
  token?: string | null;
  name?: string | null;
  role?: string | null;
};

/** Proxy live-context chat through the extension background (handoff token + cookies). */
export function fetchLiveContextChatViaExtensionProxy(
  workspaceId: string,
  body: LiveContextChatRequestBody,
  auth?: ExtensionEmbedAuth,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('Ask timed out — reload the extension panel and try again'));
    }, 120_000);

    function onMessage(event: MessageEvent) {
      if (!isExtensionPanelOrigin(event.origin, window.location.origin)) {
        return;
      }
      if (event.data?.type !== 'APROKO_EMBED_ASK_RESULT' || event.data.requestId !== requestId) {
        return;
      }

      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);

      if (!event.data.ok) {
        reject(new Error(event.data.error || 'Ask failed'));
        return;
      }

      resolve(
        new Response(String(event.data.sse ?? ''), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      );
    }

    window.addEventListener('message', onMessage);
    window.parent.postMessage(
      {
        type: 'APROKO_EMBED_ASK',
        requestId,
        workspaceId,
        body,
        token: auth?.token ?? null,
        workspaceName: auth?.name ?? null,
        workspaceRole: auth?.role ?? null,
      },
      '*',
    );
  });
}

export function shouldProxyLiveContextChatThroughExtension(embed: boolean): boolean {
  return embed && isExtensionEmbedFrame();
}
