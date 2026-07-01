'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { appPageMeta, type AppPageId } from '@/lib/navigation/app-pages';

type AppPageShellProps = {
  pageId: AppPageId;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerBadge?: string;
  headerAction?: ReactNode;
};

export function AppPageShell({
  pageId,
  children,
  title,
  subtitle,
  headerBadge,
  headerAction,
}: AppPageShellProps) {
  const meta = appPageMeta[pageId];

  return (
    <AppShell
      headerIcon={meta.icon}
      subtitle={subtitle ?? meta.subtitle}
      title={title ?? meta.title}
      {...(headerBadge ? { headerBadge } : {})}
      {...(headerAction ? { headerAction } : {})}
    >
      {children}
    </AppShell>
  );
}
