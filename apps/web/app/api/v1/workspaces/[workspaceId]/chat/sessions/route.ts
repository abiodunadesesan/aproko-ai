import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createChatSession,
  listChatSessions,
  type ChatContextMode,
  type ChatSession,
} from '@/lib/storage/chat';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';

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
      const rawBody = (await request.json().catch(() => null)) as {
        title?: string;
        contextMode?: ChatContextMode;
      } | null;

      const title = rawBody?.title?.trim() ?? '';
      const contextMode = rawBody?.contextMode ?? 'workspace';

      if (contextMode !== 'workspace') {
        return NextResponse.json({ error: 'Invalid context mode' }, { status: 400 });
      }

      const session = await deps.createChatSession(
        workspaceId,
        userId,
        title || 'New chat',
        contextMode,
      );
      if (!session) {
        return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 });
      }

      return NextResponse.json(
        {
          data: toSessionPayload(session),
        },
        { status: 201 },
      );
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
