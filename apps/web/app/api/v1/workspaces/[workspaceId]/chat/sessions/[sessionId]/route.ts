import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  deleteChatSession,
  getChatSessionById,
  updateChatSessionTitle,
  type ChatSession,
} from '@/lib/storage/chat';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type ChatSessionByIdRouteDependencies = {
  auth: AuthDependency;
  getChatSessionById: typeof getChatSessionById;
  updateChatSessionTitle: typeof updateChatSessionTitle;
  deleteChatSession: typeof deleteChatSession;
};

type RouteContext = { params: Promise<{ workspaceId: string; sessionId: string }> };

function toSessionPayload(session: ChatSession) {
  return {
    id: session.id,
    workspaceId: session.workspaceId,
    title: session.title,
    contextMode: session.contextMode,
    modelProvider: session.modelProvider,
    modelName: session.modelName,
    lastMessageAt: session.lastMessageAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export function createChatSessionByIdRouteHandlers(deps: ChatSessionByIdRouteDependencies) {
  return {
    PATCH: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, sessionId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const rawBody = (await request.json().catch(() => null)) as { title?: string } | null;
      const title = rawBody?.title?.trim() ?? '';
      if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }

      const existing = await deps.getChatSessionById(workspaceId, userId, sessionId);
      if (!existing) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const updated = await deps.updateChatSessionTitle(workspaceId, userId, sessionId, title);
      if (!updated) {
        return NextResponse.json({ error: 'Failed to update chat session' }, { status: 500 });
      }

      return NextResponse.json({ data: toSessionPayload(updated) });
    },

    DELETE: async (_request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, sessionId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const existing = await deps.getChatSessionById(workspaceId, userId, sessionId);
      if (!existing) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const deleted = await deps.deleteChatSession(workspaceId, userId, sessionId);
      if (!deleted) {
        return NextResponse.json({ error: 'Failed to delete chat session' }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    },
  };
}

export const { PATCH, DELETE } = createChatSessionByIdRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getChatSessionById,
  updateChatSessionTitle,
  deleteChatSession,
});
