import { auth } from '@clerk/nextjs/server';
import {
  assertTranscriptUploadSize,
  isAudioTranscriptFile,
  isTextTranscriptFile,
  isTranscriptionConfigured,
  transcribeAudioFile,
} from '@/lib/ai/transcription';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import {
  listTranscriptSources,
  uploadLibraryFile,
  type LibrarySource,
} from '@/lib/storage/library';
import { trackServerEvent } from '@/lib/observability/server';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type TranscriptsRouteDependencies = {
  auth: AuthDependency;
  listTranscriptSources: typeof listTranscriptSources;
  uploadLibraryFile: typeof uploadLibraryFile;
  transcribeAudioFile: typeof transcribeAudioFile;
  isTranscriptionConfigured: typeof isTranscriptionConfigured;
};

type RouteContext = { params: Promise<{ workspaceId: string }> };

function toTextFile(baseName: string, text: string): File {
  const safeBase = baseName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_') || 'recording';
  return new File([text], `${safeBase}-transcript.txt`, { type: 'text/plain' });
}

export function createTranscriptsRouteHandlers(deps: TranscriptsRouteDependencies) {
  return {
    GET: async (_request: Request, context: RouteContext) => {
      try {
        const { userId } = await deps.auth();
        if (!userId) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId } = await context.params;
        const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
        if (forbidden) {
          return forbidden;
        }
        const data = await deps.listTranscriptSources(workspaceId);
        return Response.json({ data }, { status: 200 });
      } catch (error) {
        console.error('Failed to list transcripts', error);
        return Response.json({ error: 'Failed to list transcripts' }, { status: 500 });
      }
    },

    POST: async (request: Request, context: RouteContext) => {
      try {
        const { userId } = await deps.auth();
        if (!userId) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rateLimitResponse = await enforceRateLimit({
          request,
          userId,
          policy: rateLimitPolicies.sourcesWrite,
        });
        if (rateLimitResponse) {
          return rateLimitResponse;
        }

        const { workspaceId } = await context.params;
        const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
        if (forbidden) {
          return forbidden;
        }
        const formData = await request.formData();
        const file = (formData.get('file') ?? formData.get('audio')) as File | null;

        if (!(file instanceof File)) {
          return Response.json({ error: 'File is required' }, { status: 400 });
        }

        try {
          assertTranscriptUploadSize(file);
        } catch (sizeError) {
          return Response.json(
            { error: sizeError instanceof Error ? sizeError.message : 'File too large' },
            { status: 400 },
          );
        }

        const isAudio = isAudioTranscriptFile(file);
        const isText = isTextTranscriptFile(file);

        if (!isAudio && !isText) {
          return Response.json(
            {
              error:
                'Unsupported file type. Use .txt, .md, .vtt, .srt, or audio (webm, mp3, wav, m4a).',
            },
            { status: 400 },
          );
        }

        let audioSource: LibrarySource | null = null;
        let transcriptSource: LibrarySource;

        if (isAudio) {
          if (!deps.isTranscriptionConfigured()) {
            return Response.json(
              {
                error:
                  'Speech-to-text is not configured. Set GROQ_API_KEY (preferred) or OPENAI_API_KEY on the server, or upload a .txt transcript.',
              },
              { status: 503 },
            );
          }

          audioSource = (
            await deps.uploadLibraryFile(workspaceId, file, 'transcripts', 'recordings', null, null)
          ).source;

          const transcriptText = await deps.transcribeAudioFile(file);
          const textFile = toTextFile(file.name, transcriptText);
          transcriptSource = (
            await deps.uploadLibraryFile(
              workspaceId,
              textFile,
              'transcripts',
              'uploads',
              null,
              null,
            )
          ).source;
        } else {
          transcriptSource = (
            await deps.uploadLibraryFile(workspaceId, file, 'transcripts', 'uploads', null, null)
          ).source;
        }

        await trackServerEvent({
          event: 'transcript_created',
          distinctId: userId,
          properties: {
            workspace_id: workspaceId,
            source: isAudio ? 'audio' : 'text',
            has_audio_source: Boolean(audioSource),
          },
        });

        return Response.json(
          {
            data: {
              transcript: transcriptSource,
              audio: audioSource,
            },
          },
          { status: 201 },
        );
      } catch (error) {
        console.error('Failed to create transcript', error);
        return Response.json(
          {
            error: error instanceof Error ? error.message : 'Failed to create transcript',
          },
          { status: 500 },
        );
      }
    },
  };
}

export const { GET, POST } = createTranscriptsRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listTranscriptSources,
  uploadLibraryFile,
  transcribeAudioFile,
  isTranscriptionConfigured,
});
