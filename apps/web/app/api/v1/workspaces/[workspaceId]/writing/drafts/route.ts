import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createWorkspaceWritingDraft,
  listWorkspaceWritingDrafts,
  type WorkspaceWritingDraft,
} from '@/lib/storage/writing-drafts';
import { withPerformanceHeaders } from '@/lib/perf/http';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { trackServerEvent } from '@/lib/observability/server';

type AuthDependency = () => Promise<{ userId: string | null }>;

type WritingDraftsRouteDependencies = {
  auth: AuthDependency;
  listWorkspaceWritingDrafts: typeof listWorkspaceWritingDrafts;
  createWorkspaceWritingDraft: typeof createWorkspaceWritingDraft;
};

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

function toDraftPayload(draft: WorkspaceWritingDraft) {
  return {
    id: draft.id,
    title: draft.title,
    draft: draft.draft,
    polished: draft.polished,
    mode: draft.mode,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}

export function createWritingDraftsRouteHandlers(deps: WritingDraftsRouteDependencies) {
  return {
    GET: async (_request: Request, context: RouteContext) => {
      const startedAtMs = Date.now();
      const { userId } = await deps.auth();
      if (!userId) {
        return withPerformanceHeaders(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
          startedAtMs,
        );
      }

      const { workspaceId } = await context.params;
      const drafts = await deps.listWorkspaceWritingDrafts(workspaceId, userId);
      return withPerformanceHeaders(
        NextResponse.json({ data: drafts.map(toDraftPayload) }),
        startedAtMs,
        {
          cacheControl: 'private, max-age=10, stale-while-revalidate=60',
        },
      );
    },

    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = await enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.writingDraftsWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId } = await context.params;
      const rawBody = (await request.json().catch(() => null)) as {
        title?: string;
        draft?: string;
        polished?: string;
        mode?: string;
      } | null;

      const title = rawBody?.title?.trim() ?? '';
      const draft = rawBody?.draft ?? '';
      const polished = rawBody?.polished ?? '';

      if (!title && !draft.trim() && !polished.trim()) {
        return NextResponse.json(
          { error: 'Title, draft, or polished text is required' },
          { status: 400 },
        );
      }

      const created = await deps.createWorkspaceWritingDraft(workspaceId, userId, {
        title,
        draft,
        polished,
        mode: rawBody?.mode,
      });
      if (!created) {
        return NextResponse.json({ error: 'Failed to create writing draft' }, { status: 500 });
      }

      await trackServerEvent({
        event: 'writing_draft_created',
        distinctId: userId,
        properties: {
          workspace_id: workspaceId,
          draft_id: created.id,
          mode: created.mode,
        },
      });

      return NextResponse.json({ data: toDraftPayload(created) }, { status: 201 });
    },
  };
}

export const { GET, POST } = createWritingDraftsRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listWorkspaceWritingDrafts,
  createWorkspaceWritingDraft,
});
