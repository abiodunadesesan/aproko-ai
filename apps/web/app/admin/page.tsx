'use client';

import { useEffect, useState } from 'react';
import { cardClass } from '@aproko/ui';
import { AppShell } from '@/components/app-shell';

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
    <AppShell
      subtitle="Platform-level operational view for users, workspace footprint, and usage."
      title="Admin"
    >
      <section className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className={cardClass}>
          <p className="text-sm font-medium">Usage summary</p>
          {isLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading metrics...</p>
          ) : usage ? (
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
              <p>Users: {usage.totalUsers}</p>
              <p>Workspaces: {usage.totalWorkspaces}</p>
              <p>Sources: {usage.totalSources}</p>
              <p>Messages: {usage.totalMessages}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No usage data available.</p>
          )}
        </div>

        <div className={cardClass}>
          <p className="text-sm font-medium">Users</p>
          {isLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {users.map((user) => (
                <div className="rounded-md border p-3 text-sm" key={user.clerkUserId}>
                  <p>{user.fullName ?? 'Unknown user'}</p>
                  <p className="text-muted-foreground">{user.email ?? user.clerkUserId}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cardClass}>
          <p className="text-sm font-medium">Workspace footprint</p>
          {isLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading workspaces...</p>
          ) : workspaces.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No workspace footprint yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {workspaces.map((workspace) => (
                <div className="rounded-md border p-3 text-sm" key={workspace.workspaceId}>
                  <p className="font-medium">{workspace.workspaceId}</p>
                  <p className="text-muted-foreground">
                    {workspace.projects} projects · {workspace.sources} sources ·{' '}
                    {workspace.conversations} conversations
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
