import { auth } from '@clerk/nextjs/server';
import {
  assertTranscriptUploadSize,
  isAudioTranscriptFile,
  isTranscriptionConfigured,
  transcribeAudioFile,
} from '@/lib/ai/transcription';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type ChatVoiceRouteDependencies = {
  auth: AuthDependency;
  transcribeAudioFile: typeof transcribeAudioFile;
  isTranscriptionConfigured: typeof isTranscriptionConfigured;
};

type RouteContext = { params: Promise<{ workspaceId: string }> };

export function createChatVoiceRouteHandlers(deps: ChatVoiceRouteDependencies) {
  return {
    POST: async (request: Request, context: RouteContext) => {
      try {
        const { userId } = await deps.auth();
        if (!userId) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rateLimitResponse = await enforceRateLimit({
          request,
          userId,
          policy: rateLimitPolicies.chatMessagesWrite,
        });
        if (rateLimitResponse) {
          return rateLimitResponse;
        }

        const { workspaceId } = await context.params;
        const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
        if (forbidden) {
          return forbidden;
        }

        if (!deps.isTranscriptionConfigured()) {
          return Response.json(
            {
              error:
                'Voice transcription is not configured. Set GROQ_API_KEY (preferred) or OPENAI_API_KEY, or use browser speech recognition.',
            },
            { status: 503 },
          );
        }

        const formData = await request.formData();
        const file = (formData.get('audio') ?? formData.get('file')) as File | null;
        if (!(file instanceof File)) {
          return Response.json({ error: 'Audio file is required' }, { status: 400 });
        }

        if (!isAudioTranscriptFile(file)) {
          return Response.json({ error: 'Unsupported audio type' }, { status: 400 });
        }

        try {
          assertTranscriptUploadSize(file);
        } catch (sizeError) {
          return Response.json(
            { error: sizeError instanceof Error ? sizeError.message : 'File too large' },
            { status: 400 },
          );
        }

        const text = await deps.transcribeAudioFile(file);
        return Response.json({ data: { text } }, { status: 200 });
      } catch (error) {
        console.error('Failed to transcribe chat voice input', error);
        return Response.json(
          {
            error: error instanceof Error ? error.message : 'Failed to transcribe audio',
          },
          { status: 500 },
        );
      }
    },
  };
}

export const { POST } = createChatVoiceRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  transcribeAudioFile,
  isTranscriptionConfigured,
});
