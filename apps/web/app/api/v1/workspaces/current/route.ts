import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveWorkspaceForUser, type ResolvedWorkspace } from '@/lib/storage/workspaces';
import { withPerformanceHeaders } from '@/lib/perf/http';

type AuthDependency = () => Promise<{ userId: string | null }>;

type CurrentWorkspaceRouteDependencies = {
  auth: AuthDependency;
  resolveWorkspaceForUser: typeof resolveWorkspaceForUser;
};

function toPayload(workspace: ResolvedWorkspace) {
  return {
    workspaceId: workspace.workspaceId,
    name: workspace.name,
    slug: workspace.slug,
    role: workspace.role,
  };
}

export function createCurrentWorkspaceRouteHandlers(deps: CurrentWorkspaceRouteDependencies) {
  return {
    GET: async () => {
      const startedAtMs = Date.now();
      const { userId } = await deps.auth();
      if (!userId) {
        return withPerformanceHeaders(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
          startedAtMs,
        );
      }

      const workspace = await deps.resolveWorkspaceForUser(userId);
      if (!workspace) {
        return withPerformanceHeaders(
          NextResponse.json({ error: 'Failed to resolve workspace' }, { status: 500 }),
          startedAtMs,
        );
      }

      return withPerformanceHeaders(
        NextResponse.json({ data: toPayload(workspace) }),
        startedAtMs,
        {
          cacheControl: 'private, max-age=30, stale-while-revalidate=120',
        },
      );
    },
  };
}

export const { GET } = createCurrentWorkspaceRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  resolveWorkspaceForUser,
});
