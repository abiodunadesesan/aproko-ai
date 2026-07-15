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
  /** Full-bleed layout without page header (ChatGPT-style chat). */
  immersive?: boolean;
};

export function AppPageShell({
  pageId,
  children,
  title,
  subtitle,
  headerBadge,
  headerAction,
  immersive = false,
}: AppPageShellProps) {
  const meta = appPageMeta[pageId];

  if (immersive) {
    return (
      <AppShell
        immersive
        subtitle={subtitle ?? meta.subtitle}
        title={title ?? meta.title}
        {...(headerBadge ? { headerBadge } : {})}
        {...(headerAction ? { headerAction } : {})}
      >
        {children}
      </AppShell>
    );
  }

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
