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
import { cn } from '@/lib/utils';

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

function parseSseEventsFromBuffer(buffer: string): {
  events: Array<{ event: string; data: string }>;
  rest: string;
} {
  const events: Array<{ event: string; data: string }> = [];
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';

  for (const part of parts) {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of part.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }
    if (dataLines.length) {
      events.push({ event, data: dataLines.join('\n') });
    }
  }

  return { events, rest };
}

function CursorFocusCard({ raw }: { raw: string }) {
  const parsed = useMemo(() => parseHoverFocus(raw), [raw]);
  const hasPrimary = Boolean(parsed.primaryText);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border transition-colors',
        hasPrimary
          ? 'border-amber-500/35 bg-gradient-to-br from-amber-500/[0.12] via-amber-500/[0.04] to-transparent dark:from-amber-400/15 dark:via-amber-400/[0.05]'
          : 'border-dashed border-black/[0.1] bg-zinc-50/80 dark:border-white/10 dark:bg-zinc-900/40',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/15 px-3.5 py-2.5 dark:border-amber-400/15">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex h-2 w-2 rounded-full',
              hasPrimary ? 'animate-pulse bg-amber-500 dark:bg-amber-400' : 'bg-zinc-300 dark:bg-zinc-600',
            )}
            aria-hidden
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-900 dark:text-amber-100">
            Cursor focus
          </p>
        </div>
      </div>

      <div className="space-y-3 px-3.5 py-3">
        {hasPrimary ? (
          <>
            <blockquote className="border-l-2 border-amber-500/50 pl-3 text-[14px] font-medium leading-6 text-zinc-900 dark:border-amber-400/50 dark:text-zinc-50">
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

export function ExtensionLiveClient({ embed = false }: { embed?: boolean }) {
  const { workspaceId, isLoading, error: workspaceError } = useWorkspace();
  const [webAppUrl, setWebAppUrl] = useState('');
  const [synced, setSynced] = useState<SyncedTab | null>(null);
  const [hoverText, setHoverText] = useState('');
  const [query, setQuery] = useState('');
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWebAppUrl(window.location.origin);
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isExtensionMessageOrigin(event.origin, window.location.origin)) {
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
      const payload = event.data.payload as SyncedTab | undefined;
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

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const ask = useCallback(async () => {
    if (!workspaceId || !synced || !query.trim() || streaming) {
      return;
    }

    const userQuery = query.trim();
    setQuery('');
    setError(null);
    setStreaming(true);
    setLines((prev) => [...prev, { role: 'user', content: userQuery }, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/live-context/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: synced.url,
          title: synced.title,
          pageText: synced.pageText,
          fullPageContext: synced.pageText,
          activeHoverContext: synced.activeHoverContext || hoverText || '',
          capturedAt: synced.capturedAt,
          userQuery,
          model: 'groq:llama-3.1-8b-instant',
        }),
      });

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
        const parsed = parseSseEventsFromBuffer(buffer);
        buffer = parsed.rest;

        for (const event of parsed.events) {
          if (event.event === 'delta') {
            try {
              const data = JSON.parse(event.data) as { text?: string };
              if (data.text) {
                assistant += data.text;
                const snapshot = assistant;
                setLines((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: 'assistant', content: snapshot };
                  return next;
                });
              }
            } catch {
              // ignore malformed delta
            }
          }
          if (event.event === 'error') {
            let message = 'Stream error';
            try {
              const data = JSON.parse(event.data) as { error?: string };
              message = data.error || message;
            } catch {
              // ignore malformed error payload
            }
            throw new Error(message);
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
  }, [workspaceId, synced, query, streaming, hoverText]);

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
          {(workspaceError || error) && (
            <p className="text-sm text-red-600">{workspaceError ?? error}</p>
          )}
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div
                key={`${line.role}-${index}`}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm',
                  line.role === 'user'
                    ? 'bg-amber-500/10 text-zinc-900 dark:text-amber-50'
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
              disabled={!synced || !workspaceId || streaming}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void ask();
                }
              }}
            />
            <Button
              onClick={() => void ask()}
              disabled={!synced || !workspaceId || streaming || !query.trim()}
            >
              Ask
            </Button>
          </div>
        </AppPanelBody>
      </AppPanel>
    </div>
  );

  if (embed) {
    return <div className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950">{body}</div>;
  }

  return (
    <AppPageShell pageId="liveContext">
      <AppPageFrame>{body}</AppPageFrame>
    </AppPageShell>
  );
}
