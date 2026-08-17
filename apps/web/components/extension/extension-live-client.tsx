'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppPageShell } from '@/components/app/app-page-shell';
import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
} from '@/components/app/app-surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { parseHoverFocus, summarizePageSnapshot } from '@/lib/live-context/sanitize';
import {
  parseLiveContextSseEventsFromBuffer,
  readLiveContextSseDelta,
  readLiveContextSseError,
} from '@/lib/live-context/sse-client';
import { cn } from '@/lib/utils';
import {
  EXTENSION_LIVE_CONTEXT_CHAT_PATH,
  extensionAuthHeaders,
  fetchExtensionSession,
  workspaceLiveContextChatPath,
} from '@/lib/extension/embed-api';
import {
  fetchLiveContextChatViaExtensionProxy,
  shouldProxyLiveContextChatThroughExtension,
} from '@/lib/extension/embed-ask';
import { openInExtensionBrowserTab } from '@/lib/extension/embed-frame';

const mono = 'rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-zinc-800';

type SyncedTab = {
  url: string;
  title: string;
  pageText: string;
  activeHoverContext?: string;
  capturedAt: string;
};

type ChatLine = {
  role: 'user' | 'assistant';
  content: string;
};

function isExtensionMessageOrigin(origin: string, pageOrigin: string): boolean {
  return (
    origin === pageOrigin ||
    origin.startsWith('chrome-extension://') ||
    origin.startsWith('safari-web-extension://') ||
    origin.startsWith('safari-extension://')
  );
}

function CursorFocusCard({ raw }: { raw: string }) {
  const parsed = useMemo(() => parseHoverFocus(raw), [raw]);
  const hasPrimary = Boolean(parsed.primaryText);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border transition-colors',
        hasPrimary
          ? 'border-zinc-300/70 bg-gradient-to-br from-zinc-100/90 via-zinc-50/50 to-transparent dark:border-zinc-700/70 dark:from-zinc-900/70 dark:via-zinc-900/30'
          : 'border-dashed border-black/[0.1] bg-zinc-50/80 dark:border-white/10 dark:bg-zinc-900/40',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 px-3.5 py-2.5 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex h-2 w-2 rounded-full',
              hasPrimary ? 'animate-pulse bg-zinc-700 dark:bg-zinc-200' : 'bg-zinc-300 dark:bg-zinc-600',
            )}
            aria-hidden
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600 dark:text-zinc-300">
            Cursor focus
          </p>
        </div>
      </div>

      <div className="space-y-3 px-3.5 py-3">
        {hasPrimary ? (
          <>
            <blockquote className="border-l-2 border-zinc-400/60 pl-3 text-[14px] font-medium leading-6 text-zinc-900 dark:border-zinc-500/60 dark:text-zinc-50">
              {parsed.primaryText.slice(0, 320)}
              {parsed.primaryText.length > 320 ? '…' : ''}
            </blockquote>
            {parsed.surroundingText && parsed.surroundingText !== parsed.primaryText ? (
              <div className="rounded-xl bg-white/60 px-3 py-2 dark:bg-zinc-950/40">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Surrounding context
                </p>
                <p className="line-clamp-4 text-[12px] leading-5 text-zinc-600 dark:text-zinc-300">
                  {parsed.surroundingText.slice(0, 420)}
                  {parsed.surroundingText.length > 420 ? '…' : ''}
                </p>
              </div>
            ) : null}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Alt/Option-click a question on the page to solve · Ask below about this focus
            </p>
          </>
        ) : (
          <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Move your cursor over page text. Focus updates live here.
          </p>
        )}
      </div>
    </div>
  );
}

function ExtensionEmbedSignIn({
  webAppUrl,
  onReload,
}: {
  webAppUrl: string;
  onReload: () => void;
}) {
  const connectUrl = `${webAppUrl.replace(/\/$/, '')}/extension/connect?from=extension`;

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Sign in required
        </p>
        <h2 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Open Aproko in a full browser tab
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Google sign-in cannot run inside the extension panel. We&apos;ll open Aproko in a new tab —
          if you&apos;re already signed in you&apos;ll see your workspace; otherwise you&apos;ll be
          asked to sign in, then return here.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => openInExtensionBrowserTab(connectUrl)}
        >
          Open Aproko tab
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onReload}>
          Reload panel
        </Button>
      </div>
      <p className="text-xs leading-5 text-zinc-500">
        After the tab shows you&apos;re connected, return here — the panel checks every few seconds,
        or click <strong className="font-medium text-zinc-700 dark:text-zinc-200">Reload panel</strong>.
        Then use <strong className="font-medium text-zinc-700 dark:text-zinc-200">Capture tab</strong>{' '}
        or <kbd className={mono}>Cmd+Shift+Y</kbd>.
      </p>
    </div>
  );
}

function PageSnapshotCard({
  title,
  pageText,
}: {
  title: string;
  pageText: string;
}) {
  const snapshot = useMemo(() => summarizePageSnapshot(pageText, title), [pageText, title]);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white/80 dark:border-white/[0.08] dark:bg-zinc-900/60">
      <div className="border-b border-black/[0.05] px-3.5 py-2.5 dark:border-white/[0.06]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Page snapshot
        </p>
      </div>
      <div className="space-y-3 px-3.5 py-3">
        <p className="text-[14px] leading-6 text-zinc-800 dark:text-zinc-100">{snapshot.summary}</p>
        {snapshot.highlights.length ? (
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              Key points
            </p>
            <ul className="space-y-2">
              {snapshot.highlights.map((item, index) => (
                <li
                  key={`${index}-${item.slice(0, 28)}`}
                  className="flex gap-2 text-[13px] leading-5 text-zinc-700 dark:text-zinc-200"
                >
                  <span
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type ExtensionAuthState = {
  token: string;
  workspaceId: string;
  name: string | null;
  role: string | null;
};

export function ExtensionLiveClient({ embed = false }: { embed?: boolean }) {
  const { workspaceId, isLoading, error: workspaceError, refresh } = useWorkspace();
  const [extensionAuth, setExtensionAuth] = useState<ExtensionAuthState | null>(null);
  const activeWorkspaceId = extensionAuth?.workspaceId ?? workspaceId;
  const [webAppUrl, setWebAppUrl] = useState('');
  const [synced, setSynced] = useState<SyncedTab | null>(null);
  const [hoverText, setHoverText] = useState('');
  const [query, setQuery] = useState('');
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authValidated, setAuthValidated] = useState(false);

  const visibleWorkspaceError =
    workspaceError && !extensionAuth?.workspaceId && !authValidated ? workspaceError : null;

  useEffect(() => {
    setWebAppUrl(window.location.origin);
    if (embed) {
      window.parent.postMessage({ type: 'APROKO_REQUEST_EXTENSION_AUTH' }, '*');
    }
  }, [embed]);

  useEffect(() => {
    if (!embed || !extensionAuth?.token) {
      return;
    }

    setError(null);
    let cancelled = false;

    void fetchExtensionSession(extensionAuth.token).then((session) => {
      if (cancelled) {
        return;
      }
      if (!session) {
        setAuthValidated(false);
        setError('Session expired. Open the connect checklist in a browser tab, then reload the panel.');
        return;
      }

      setAuthValidated(true);
      setExtensionAuth((current) =>
        current
          ? {
              ...current,
              workspaceId: session.workspaceId,
              name: session.name,
              role: session.role,
            }
          : current,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [embed, extensionAuth?.token]);

  useEffect(() => {
    if (!embed || activeWorkspaceId || isLoading) {
      return;
    }

    const timer = window.setInterval(() => {
      window.parent.postMessage({ type: 'APROKO_REQUEST_EXTENSION_AUTH' }, '*');
      void refresh();
    }, 3000);

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    }

    window.addEventListener('focus', onVisibilityChange);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onVisibilityChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [embed, activeWorkspaceId, isLoading, refresh]);

  useEffect(() => {
    function applyLiveContextPayload(payload: SyncedTab | undefined) {
      if (!payload?.url || !payload.pageText) {
        return;
      }
      const hover = payload.activeHoverContext || '';
      setHoverText(hover);
      setSynced({
        url: payload.url,
        title: payload.title || 'Untitled',
        pageText: payload.pageText,
        activeHoverContext: hover,
        capturedAt: payload.capturedAt || new Date().toISOString(),
      });
    }

    function onMessage(event: MessageEvent) {
      if (!isExtensionMessageOrigin(event.origin, window.location.origin)) {
        return;
      }

      if (event.data?.type === 'APROKO_EXTENSION_AUTH' && event.data.auth?.token) {
        setExtensionAuth({
          token: event.data.auth.token,
          workspaceId: event.data.auth.workspaceId,
          name: event.data.auth.name ?? null,
          role: event.data.auth.role ?? null,
        });
        return;
      }

      if (event.data?.type === 'APROKO_HOVER_UPDATED') {
        const text =
          (typeof event.data.activeHoverContext === 'string' && event.data.activeHoverContext) ||
          event.data.hover?.localText ||
          '';
        setHoverText(text);
        setSynced((prev) => (prev ? { ...prev, activeHoverContext: text } : prev));
        return;
      }

      if (event.data?.type !== 'APROKO_LIVE_CONTEXT') {
        return;
      }
      applyLiveContextPayload(event.data.payload as SyncedTab | undefined);
    }

    window.addEventListener('message', onMessage);
    if (embed) {
      (
        window as Window & { __aprokoLiveContextInject?: (payload: SyncedTab) => void }
      ).__aprokoLiveContextInject = applyLiveContextPayload;
    }

    return () => {
      window.removeEventListener('message', onMessage);
      if (embed) {
        delete (window as Window & { __aprokoLiveContextInject?: (payload: SyncedTab) => void })
          .__aprokoLiveContextInject;
      }
    };
  }, [embed]);

  const ask = useCallback(async () => {
    if (!activeWorkspaceId || !synced || !query.trim() || streaming) {
      return;
    }

    const userQuery = query.trim();
    setQuery('');
    setError(null);
    setStreaming(true);
    setLines((prev) => [...prev, { role: 'user', content: userQuery }, { role: 'assistant', content: '' }]);

    const requestBody = {
      url: synced.url,
      title: synced.title,
      pageText: synced.pageText,
      fullPageContext: synced.pageText,
      activeHoverContext: synced.activeHoverContext || hoverText || '',
      capturedAt: synced.capturedAt,
      userQuery,
    };

    try {
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...extensionAuthHeaders(extensionAuth?.token),
      };

      const chatUrl = embed
        ? EXTENSION_LIVE_CONTEXT_CHAT_PATH
        : workspaceLiveContextChatPath(activeWorkspaceId);

      let response = await fetch(chatUrl, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders,
        body: JSON.stringify(requestBody),
      });

      if (
        !response.ok &&
        response.status === 401 &&
        shouldProxyLiveContextChatThroughExtension(embed)
      ) {
        response = await fetchLiveContextChatViaExtensionProxy(activeWorkspaceId, requestBody, {
          token: extensionAuth?.token ?? null,
          name: extensionAuth?.name ?? null,
          role: extensionAuth?.role ?? null,
        });
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let assistant = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseLiveContextSseEventsFromBuffer(buffer);
        buffer = parsed.rest;

        for (const event of parsed.events) {
          if (event.event === 'delta') {
            const delta = readLiveContextSseDelta(event.payload);
            if (delta) {
              assistant += delta;
              const snapshot = assistant;
              setLines((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: snapshot };
                return next;
              });
            }
          }
          if (event.event === 'error') {
            throw new Error(readLiveContextSseError(event.payload));
          }
        }
      }

      if (!assistant.trim()) {
        setError('Empty response from the model. Check API keys / quota.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ask failed';
      setError(message);
      setLines((prev) => {
        const next = [...prev];
        if (next[next.length - 1]?.role === 'assistant' && !next[next.length - 1]?.content) {
          next.pop();
        }
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }, [activeWorkspaceId, embed, extensionAuth?.token, synced, query, streaming, hoverText]);

  const body = (
    <div className="space-y-6">
      {!embed ? (
        <AppPanel>
          <AppPanelHeader title="Browser extension setup" />
          <AppPanelBody className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Chrome / Edge:</strong> open{' '}
                <code className={mono}>chrome://extensions</code>, Load unpacked from{' '}
                <code className={mono}>apps/extension/extension</code>.
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Safari:</strong> follow{' '}
                <code className={mono}>apps/extension/safari/README.md</code> (Develop → Allow
                Unsigned Extensions, or convert with Xcode).
              </li>
              <li>Stay signed in to Aproko in this browser profile.</li>
              <li>
                Press <kbd className={mono}>Ctrl/Cmd+Shift+Y</kbd> to capture, then open the panel
                from the toolbar.
              </li>
            </ol>
            <p>
              Web app URL for the extension settings: <code className={mono}>{webAppUrl || '…'}</code>
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="/extension/connect">Open connect checklist</a>
            </Button>
          </AppPanelBody>
        </AppPanel>
      ) : null}

      <AppPanel>
        <AppPanelHeader title="Synced browser tab" />
        <AppPanelBody className="space-y-4">
          {synced ? (
            <>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{synced.title}</p>
                <p className="truncate text-xs text-zinc-500">{synced.url}</p>
                <p className="text-xs text-zinc-400">{new Date(synced.capturedAt).toLocaleString()}</p>
              </div>
              <CursorFocusCard raw={hoverText || synced.activeHoverContext || ''} />
              <PageSnapshotCard title={synced.title} pageText={synced.pageText} />
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              No tab synced yet. Hover text on a page, then Capture from the extension side panel.
            </p>
          )}
        </AppPanelBody>
      </AppPanel>

      <AppPanel>
        <AppPanelHeader title="Ask about this page" />
        <AppPanelBody className="space-y-4">
          {(visibleWorkspaceError || error) && (
            <p className="text-sm text-red-600">{visibleWorkspaceError ?? error}</p>
          )}
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div
                key={`${line.role}-${index}`}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm',
                  line.role === 'user'
                    ? 'bg-zinc-200/70 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100',
                )}
              >
                <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-400">{line.role}</p>
                <p className="whitespace-pre-wrap">{line.content || (streaming ? '…' : '')}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={isLoading ? 'Loading workspace…' : 'Ask about the synced page'}
              disabled={!synced || !activeWorkspaceId || streaming}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void ask();
                }
              }}
            />
            <Button
              onClick={() => void ask()}
              disabled={!synced || !activeWorkspaceId || streaming || !query.trim()}
            >
              Ask
            </Button>
          </div>
        </AppPanelBody>
      </AppPanel>
    </div>
  );

  if (embed) {
    const needsSignIn = !isLoading && !activeWorkspaceId && !extensionAuth?.token;

    return (
      <div className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950">
        {needsSignIn ? (
          <ExtensionEmbedSignIn
            webAppUrl={webAppUrl || window.location.origin}
            onReload={() => {
              window.parent.postMessage({ type: 'APROKO_REQUEST_EXTENSION_AUTH' }, '*');
              void refresh();
            }}
          />
        ) : (
          body
        )}
      </div>
    );
  }

  return (
    <AppPageShell pageId="liveContext">
      <AppPageFrame>{body}</AppPageFrame>
    </AppPageShell>
  );
}
