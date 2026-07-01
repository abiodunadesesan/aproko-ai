'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { EmptyState } from '@/components/app/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
      headerIcon={ShieldCheck}
      subtitle="Platform-level operational view for users, workspace footprint, and usage."
      title="Admin"
    >
      <section className="space-y-6">
        {error === 'Admin access required.' ? (
          <EmptyState
            description="This area is restricted to platform administrators. Contact your workspace owner if you need access."
            icon={ShieldCheck}
            title="Admin access required"
          />
        ) : error ? (
          <div
            className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {!error || error !== 'Admin access required.' ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Usage summary</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2" role="status">
                    <p className="sr-only">Loading admin usage data</p>
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : usage ? (
                  <div className="grid gap-2 text-sm md:grid-cols-4">
                    <div className="rounded-md border bg-muted/20 p-3">
                      Users: {usage.totalUsers}
                    </div>
                    <div className="rounded-md border bg-muted/20 p-3">
                      Workspaces: {usage.totalWorkspaces}
                    </div>
                    <div className="rounded-md border bg-muted/20 p-3">
                      Sources: {usage.totalSources}
                    </div>
                    <div className="rounded-md border bg-muted/20 p-3">
                      Messages: {usage.totalMessages}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No usage data available.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Users</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users found.</p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        className="rounded-md border p-3 text-sm transition-colors hover:bg-muted/40"
                        key={user.clerkUserId}
                      >
                        <p>{user.fullName ?? 'Unknown user'}</p>
                        <p className="text-muted-foreground">{user.email ?? user.clerkUserId}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Workspace footprint</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading workspaces...</p>
                ) : workspaces.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No workspace footprint yet.</p>
                ) : (
                  <div className="space-y-2">
                    {workspaces.map((workspace) => (
                      <div
                        className="rounded-md border p-3 text-sm transition-colors hover:bg-muted/40"
                        key={workspace.workspaceId}
                      >
                        <p className="font-medium">{workspace.workspaceId}</p>
                        <p className="text-muted-foreground">
                          {workspace.projects} projects · {workspace.sources} sources ·{' '}
                          {workspace.conversations} conversations
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
