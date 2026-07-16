import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createChatSession,
  listChatSessions,
  type ChatContextMode,
  type ChatSession,
} from '@/lib/storage/chat';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type ChatSessionsRouteDependencies = {
  auth: AuthDependency;
  listChatSessions: typeof listChatSessions;
  createChatSession: typeof createChatSession;
};

type RouteContext = { params: Promise<{ workspaceId: string }> };

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

export function createChatSessionsRouteHandlers(deps: ChatSessionsRouteDependencies) {
  return {
    GET: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = await enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.chatSessionsRead,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const sessions = await deps.listChatSessions(workspaceId, userId);

      return NextResponse.json({
        data: sessions.map(toSessionPayload),
      });
    },

    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = await enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.chatSessionsWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const rawBody = (await request.json().catch(() => null)) as {
        title?: string;
        contextMode?: ChatContextMode;
      } | null;

      const title = rawBody?.title?.trim() ?? '';
      const contextMode = rawBody?.contextMode ?? 'workspace';

      if (contextMode !== 'workspace') {
        return NextResponse.json({ error: 'Invalid context mode' }, { status: 400 });
      }

      try {
        const session = await deps.createChatSession(
          workspaceId,
          userId,
          title || 'New chat',
          contextMode,
        );

        return NextResponse.json(
          {
            data: toSessionPayload(session),
          },
          { status: 201 },
        );
      } catch (createError) {
        const message =
          createError instanceof Error ? createError.message : 'Failed to create chat session';
        const status = /not configured/i.test(message) ? 503 : 500;
        return NextResponse.json({ error: message }, { status });
      }
    },
  };
}

export const { GET, POST } = createChatSessionsRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listChatSessions,
  createChatSession,
});
