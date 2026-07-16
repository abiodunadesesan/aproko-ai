import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  deleteWorkspaceWritingDraft,
  getWorkspaceWritingDraftById,
  updateWorkspaceWritingDraft,
  type WorkspaceWritingDraft,
} from '@/lib/storage/writing-drafts';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';

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
        mode: rawBody?.mode,
      });
      if (!updated) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }

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
      const deleted = await deps.deleteWorkspaceWritingDraft(workspaceId, userId, draftId);
      if (!deleted) {
        return NextResponse.json({ error: 'Draft not found or delete failed' }, { status: 404 });
      }

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
