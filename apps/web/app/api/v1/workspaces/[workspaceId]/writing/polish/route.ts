import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  isWritingPolishMode,
  polishWriting,
  type WritingPolishMode,
} from '@/lib/ai/writing-polish';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { trackServerEvent } from '@/lib/observability/server';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type WritingPolishRouteDependencies = {
  auth: AuthDependency;
  polishWriting: typeof polishWriting;
};

type RouteContext = { params: Promise<{ workspaceId: string }> };

export function createWritingPolishRouteHandlers(deps: WritingPolishRouteDependencies) {
  return {
    POST: async (request: Request, context: RouteContext) => {
      try {
        const { userId } = await deps.auth();
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rateLimitResponse = await enforceRateLimit({
          request,
          userId,
          policy: rateLimitPolicies.writingPolishWrite,
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
          text?: string;
          mode?: string;
        } | null;

        const text = rawBody?.text?.trim() ?? '';
        const modeRaw = rawBody?.mode?.trim() || 'clarity';

        if (!text) {
          return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        if (!isWritingPolishMode(modeRaw)) {
          return NextResponse.json(
            {
              error: 'Unsupported mode. Use clarity, concise, professional, or academic.',
            },
            { status: 400 },
          );
        }

        const mode: WritingPolishMode = modeRaw;
        const result = await deps.polishWriting({ text, mode });

        await trackServerEvent({
          event: 'writing_polished',
          distinctId: userId,
          properties: {
            workspace_id: workspaceId,
            mode: result.mode,
            engine: result.engine,
            reason: result.reason ?? null,
            input_chars: text.length,
            output_chars: result.polished.length,
          },
        });

        return NextResponse.json(
          {
            data: {
              polished: result.polished,
              mode: result.mode,
              engine: result.engine,
              reason: result.reason ?? null,
              detail: result.detail ?? null,
            },
          },
          { status: 200 },
        );
      } catch (error) {
        console.error('Failed to polish writing', error);
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : 'Failed to polish writing',
          },
          { status: 500 },
        );
      }
    },
  };
}

export const { POST } = createWritingPolishRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  polishWriting,
});
