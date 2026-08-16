'use client';

import { useEffect, useState } from 'react';
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

export default function ExtensionConnectPage() {
  const { workspaceId, name, isLoading, error } = useWorkspace();
  const [origin, setOrigin] = useState('http://localhost:3000');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <AppPageShell pageId="extensionConnect">
      <AppPageFrame>
        <div className="space-y-6">
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
              {error ? <p className="text-red-600">{error}</p> : null}
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
              <Button asChild>
                <a href="/extension/live">Open live context dashboard</a>
              </Button>
            </AppPanelBody>
          </AppPanel>
        </div>
      </AppPageFrame>
    </AppPageShell>
  );
}
