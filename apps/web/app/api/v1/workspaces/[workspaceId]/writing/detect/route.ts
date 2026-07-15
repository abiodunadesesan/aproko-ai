import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  buildTurnitinUnavailableResult,
  checkWithGptZero,
  type DetectorCheckResult,
} from '@/lib/ai/writing-detector-check';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { trackServerEvent } from '@/lib/observability/server';

type AuthDependency = () => Promise<{ userId: string | null }>;

type WritingDetectRouteDependencies = {
  auth: AuthDependency;
  checkWithGptZero: typeof checkWithGptZero;
  buildTurnitinUnavailableResult: typeof buildTurnitinUnavailableResult;
};

type RouteContext = { params: Promise<{ workspaceId: string }> };

export function createWritingDetectRouteHandlers(deps: WritingDetectRouteDependencies) {
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
          policy: rateLimitPolicies.writingDetectWrite,
        });
        if (rateLimitResponse) {
          return rateLimitResponse;
        }

        const { workspaceId } = await context.params;
        const rawBody = (await request.json().catch(() => null)) as {
          text?: string;
          source?: 'draft' | 'polished';
        } | null;

        const text = rawBody?.text?.trim() ?? '';
        if (!text) {
          return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        let gptzero: DetectorCheckResult;
        try {
          gptzero = await deps.checkWithGptZero(text);
        } catch (checkError) {
          return NextResponse.json(
            {
              error: checkError instanceof Error ? checkError.message : 'Detector check failed',
            },
            { status: 502 },
          );
        }

        const turnitin = deps.buildTurnitinUnavailableResult();

        await trackServerEvent({
          event: 'writing_detector_checked',
          distinctId: userId,
          properties: {
            workspace_id: workspaceId,
            source: rawBody?.source ?? 'draft',
            gptzero_available: gptzero.available,
            classification: gptzero.classification,
          },
        });

        return NextResponse.json({
          data: {
            gptzero,
            turnitin,
          },
        });
      } catch (error) {
        console.error('Failed to run writing detector check', error);
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : 'Failed to run detector check',
          },
          { status: 500 },
        );
      }
    },
  };
}

export const { POST } = createWritingDetectRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  checkWithGptZero,
  buildTurnitinUnavailableResult,
});
