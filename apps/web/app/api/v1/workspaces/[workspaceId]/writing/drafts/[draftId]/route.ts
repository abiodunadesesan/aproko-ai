import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  deleteWorkspaceWritingDraft,
  getWorkspaceWritingDraftById,
  updateWorkspaceWritingDraft,
  type WorkspaceWritingDraft,
} from '@/lib/storage/writing-drafts';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { trackServerEvent } from '@/lib/observability/server';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type WritingDraftByIdRouteDependencies = {
  auth: AuthDependency;
  getWorkspaceWritingDraftById: typeof getWorkspaceWritingDraftById;
  updateWorkspaceWritingDraft: typeof updateWorkspaceWritingDraft;
  deleteWorkspaceWritingDraft: typeof deleteWorkspaceWritingDraft;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; draftId: string }>;
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

export function createWritingDraftByIdRouteHandlers(deps: WritingDraftByIdRouteDependencies) {
  return {
    GET: async (_request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, draftId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const draft = await deps.getWorkspaceWritingDraftById(workspaceId, userId, draftId);
      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }

      return NextResponse.json({ data: toDraftPayload(draft) });
    },

    PATCH: async (request: Request, context: RouteContext) => {
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

      const { workspaceId, draftId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
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

      const updated = await deps.updateWorkspaceWritingDraft(workspaceId, userId, draftId, {
        title,
        draft,
        polished,
        ...(rawBody?.mode !== undefined ? { mode: rawBody.mode } : {}),
      });
      if (!updated) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }

      await trackServerEvent({
        event: 'writing_draft_updated',
        distinctId: userId,
        properties: {
          workspace_id: workspaceId,
          draft_id: updated.id,
          mode: updated.mode,
        },
      });

      return NextResponse.json({ data: toDraftPayload(updated) });
    },

    DELETE: async (request: Request, context: RouteContext) => {
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

      const { workspaceId, draftId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const deleted = await deps.deleteWorkspaceWritingDraft(workspaceId, userId, draftId);
      if (!deleted) {
        return NextResponse.json({ error: 'Draft not found or delete failed' }, { status: 404 });
      }

      await trackServerEvent({
        event: 'writing_draft_deleted',
        distinctId: userId,
        properties: {
          workspace_id: workspaceId,
          draft_id: draftId,
        },
      });

      return NextResponse.json({ ok: true });
    },
  };
}

export const { GET, PATCH, DELETE } = createWritingDraftByIdRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getWorkspaceWritingDraftById,
  updateWorkspaceWritingDraft,
  deleteWorkspaceWritingDraft,
});
