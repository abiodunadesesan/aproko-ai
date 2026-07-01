'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import type { AppPageMeta } from '@/lib/navigation/app-pages';

type AppPageShellProps = {
  meta: AppPageMeta;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerBadge?: string;
  headerAction?: ReactNode;
};

export function AppPageShell({
  meta,
  children,
  title,
  subtitle,
  headerBadge,
  headerAction,
}: AppPageShellProps) {
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
