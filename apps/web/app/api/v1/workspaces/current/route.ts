import { NextResponse } from 'next/server';
import { resolveExtensionRequestAuth } from '@/lib/extension/request-auth';
import { resolveWorkspaceForUser, type ResolvedWorkspace } from '@/lib/storage/workspaces';
import { withPerformanceHeaders } from '@/lib/perf/http';

type AuthDependency = (request: Request) => Promise<{ userId: string | null }>;

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
    GET: async (request: Request) => {
      const startedAtMs = Date.now();
      const resolved = await resolveExtensionRequestAuth(request);
      const userId = resolved?.userId ?? null;
      if (!userId) {
        return withPerformanceHeaders(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
          startedAtMs,
        );
      }

      if (resolved?.source === 'extension-handoff' && resolved.handoff) {
        return withPerformanceHeaders(
          NextResponse.json({
            data: {
              workspaceId: resolved.handoff.workspaceId,
              name: resolved.handoff.workspaceName,
              slug: resolved.handoff.workspaceId,
              role: resolved.handoff.role,
            },
          }),
          startedAtMs,
          {
            cacheControl: 'private, max-age=30, stale-while-revalidate=120',
          },
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
  auth: async (request) => {
    const resolved = await resolveExtensionRequestAuth(request);
    return { userId: resolved?.userId ?? null };
  },
  resolveWorkspaceForUser,
});
