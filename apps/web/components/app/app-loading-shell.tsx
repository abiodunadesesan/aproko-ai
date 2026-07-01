'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { appPageMeta, type AppPageId } from '@/lib/navigation/app-pages';

type AppLoadingShellProps = {
  pageId: AppPageId;
  children: ReactNode;
};

export function AppLoadingShell({ pageId, children }: AppLoadingShellProps) {
  const meta = appPageMeta[pageId];

  return (
    <AppShell headerIcon={meta.icon} subtitle={meta.subtitle} title={meta.title}>
      {children}
    </AppShell>
  );
}
