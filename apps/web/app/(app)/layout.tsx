import type { ReactNode } from 'react';
import { connection } from 'next/server';
import { WorkspaceProvider } from '@/components/workspace/workspace-provider';

export default async function AppLayout({ children }: { children: ReactNode }) {
  await connection();
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
