import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import type { AppPageMeta } from '@/lib/navigation/app-pages';

type AppLoadingShellProps = {
  meta: AppPageMeta;
  children: ReactNode;
};

export function AppLoadingShell({ meta, children }: AppLoadingShellProps) {
  return (
    <AppShell headerIcon={meta.icon} subtitle={meta.subtitle} title={meta.title}>
      {children}
    </AppShell>
  );
}
