'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
  appSurface,
} from '@/components/app/app-surface';
import { EmptyState } from '@/components/app/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type AdminUsageSummary = {
  totalUsers: number;
  totalWorkspaces: number;
  totalSources: number;
  totalMessages: number;
};

type AdminUser = {
  clerkUserId: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
};

type AdminWorkspace = {
  workspaceId: string;
  projects: number;
  sources: number;
  conversations: number;
};

async function fetchJsonWithTimeout(url: string, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    const payload = await response.json();
    return { response, payload };
  } finally {
    clearTimeout(timeoutId);
  }
}

export default function AdminPage() {
  const [usage, setUsage] = useState<AdminUsageSummary | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [usageResult, usersResult, workspacesResult] = await Promise.all([
          fetchJsonWithTimeout('/api/v1/admin/usage'),
          fetchJsonWithTimeout('/api/v1/admin/users'),
          fetchJsonWithTimeout('/api/v1/admin/workspaces'),
        ]);

        const responses = [usageResult.response, usersResult.response, workspacesResult.response];
        if (responses.some((res) => !res.ok)) {
          if (responses.some((res) => res.status === 403)) {
            throw new Error('Admin access required.');
          }
          throw new Error('Failed to load admin dashboard.');
        }

        const usagePayload = usageResult.payload as { data: AdminUsageSummary };
        const usersPayload = usersResult.payload as { data: AdminUser[] };
        const workspacesPayload = workspacesResult.payload as { data: AdminWorkspace[] };

        setUsage(usagePayload.data);
        setUsers(usersPayload.data ?? []);
        setWorkspaces(workspacesPayload.data ?? []);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Admin data request timed out. Please retry.');
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load admin dashboard.');
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <AppPageShell pageId="admin">
      <AppPageFrame>
        {error === 'Admin access required.' ? (
          <EmptyState
            description="This area is restricted to platform administrators. Contact your workspace owner if you need access."
            icon={ShieldCheck}
            title="Admin access required"
          />
        ) : error ? (
          <div className={appSurface.alert} role="alert">
            {error}
          </div>
        ) : null}

        {!error || error !== 'Admin access required.' ? (
          <>
            <AppPanel>
              <AppPanelHeader title="Usage summary" />
              <AppPanelBody>
                {isLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4" role="status">
                    <p className="sr-only">Loading admin usage data</p>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton className="h-20 w-full rounded-xl" key={index} />
                    ))}
                  </div>
                ) : usage ? (
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    {[
                      { label: 'Users', value: usage.totalUsers },
                      { label: 'Workspaces', value: usage.totalWorkspaces },
                      { label: 'Sources', value: usage.totalSources },
                      { label: 'Messages', value: usage.totalMessages },
                    ].map((metric) => (
                      <div className={cn(appSurface.inset, 'p-3.5 sm:p-4')} key={metric.label}>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No usage data available.</p>
                )}
              </AppPanelBody>
            </AppPanel>

            <AppPanel>
              <AppPanelHeader title="Users" />
              <AppPanelBody>
                {isLoading ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No users found.</p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div className={cn(appSurface.inset, 'p-3.5')} key={user.clerkUserId}>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {user.fullName ?? 'Unknown user'}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                          {user.email ?? user.clerkUserId}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </AppPanelBody>
            </AppPanel>

            <AppPanel>
              <AppPanelHeader title="Workspace footprint" />
              <AppPanelBody>
                {isLoading ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading workspaces...</p>
                ) : workspaces.length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    No workspace footprint yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {workspaces.map((workspace) => (
                      <div className={cn(appSurface.inset, 'p-3.5')} key={workspace.workspaceId}>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {workspace.workspaceId}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                          {workspace.projects} projects · {workspace.sources} sources ·{' '}
                          {workspace.conversations} conversations
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </AppPanelBody>
            </AppPanel>
          </>
        ) : null}
      </AppPageFrame>
    </AppPageShell>
  );
}
