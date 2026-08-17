'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AppPageShell } from '@/components/app/app-page-shell';
import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
} from '@/components/app/app-surface';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/components/workspace/workspace-provider';

const mono = 'rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-zinc-800';

function ExtensionConnectContent() {
  const searchParams = useSearchParams();
  const fromExtension = searchParams.get('from') === 'extension';
  const { workspaceId, name, isLoading, error } = useWorkspace();
  const [origin, setOrigin] = useState('http://localhost:3000');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const signedIn = Boolean(workspaceId) && !isLoading;

  return (
    <AppPageShell pageId="extensionConnect">
      <AppPageFrame>
        <div className="space-y-6">
          {fromExtension ? (
            <AppPanel>
              <AppPanelHeader title="Extension connection" />
              <AppPanelBody className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                {signedIn ? (
                  <>
                    <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                      You&apos;re signed in — the extension can use this session.
                    </p>
                    <p>
                      Return to the extension panel (Chrome side panel or Safari toolbar popup). It
                      should connect automatically within a few seconds. If not, click{' '}
                      <strong className="text-zinc-800 dark:text-zinc-200">Reload panel</strong>.
                    </p>
                    <p>
                      Active workspace:{' '}
                      <strong className="text-zinc-900 dark:text-zinc-50">{name ?? 'Personal'}</strong>
                      {workspaceId ? (
                        <>
                          {' '}
                          (<code className={mono}>{workspaceId}</code>)
                        </>
                      ) : null}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                      Sign in to connect the extension
                    </p>
                    <p>
                      You opened this page from the browser extension. Sign in below (Google or email)
                      — after auth you&apos;ll land back here, then return to the extension panel.
                    </p>
                    {error ? <p className="text-red-600">{error}</p> : null}
                    <Button asChild>
                      <a href={`/sign-in?redirect_url=${encodeURIComponent('/extension/connect?from=extension')}`}>
                        Continue to sign in
                      </a>
                    </Button>
                  </>
                )}
              </AppPanelBody>
            </AppPanel>
          ) : null}

          <AppPanel>
            <AppPanelHeader title="Checklist" />
            <AppPanelBody className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <ul className="list-disc space-y-2 pl-5">
                <li>Sign in to Aproko in a normal browser tab (same profile as the extension).</li>
                <li>
                  <strong>Chrome / Edge:</strong> load unpacked from{' '}
                  <code className={mono}>apps/extension/extension</code>, then reload after updates.
                </li>
                <li>
                  <strong>Safari:</strong> sync with{' '}
                  <code className={mono}>pnpm --filter @aproko/extension sync:safari</code>, then
                  follow <code className={mono}>apps/extension/safari/README.md</code>.
                </li>
                <li>
                  Panel Settings → Web app URL = <code className={mono}>{origin}</code>.
                </li>
                <li>
                  The panel embeds this signed-in app (cookies work there). Extension-only fetch
                  cannot see Clerk cookies.
                </li>
                <li>
                  Capture with <kbd className={mono}>Ctrl/Cmd+Shift+Y</kbd>, then ask in the embedded
                  panel.
                </li>
              </ul>
              {!fromExtension && error ? <p className="text-red-600">{error}</p> : null}
              {!fromExtension ? (
                <p>
                  Active workspace:{' '}
                  <strong className="text-zinc-900 dark:text-zinc-50">
                    {isLoading ? 'Loading…' : (name ?? 'Unknown')}
                  </strong>
                  {workspaceId ? (
                    <>
                      {' '}
                      (<code className={mono}>{workspaceId}</code>)
                    </>
                  ) : null}
                </p>
              ) : null}
              <Button asChild variant={fromExtension && signedIn ? 'default' : 'outline'} size="sm">
                <a href="/extension/live">Open live context dashboard</a>
              </Button>
            </AppPanelBody>
          </AppPanel>
        </div>
      </AppPageFrame>
    </AppPageShell>
  );
}

export default function ExtensionConnectPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading extension connect…</div>}>
      <ExtensionConnectContent />
    </Suspense>
  );
}
