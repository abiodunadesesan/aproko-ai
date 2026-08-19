import { liveContextPreflightResponse, withLiveContextCors } from '@/lib/live-context/cors';
import { resolveExtensionRequestAuth } from '@/lib/extension/request-auth';
import {
  assertTranscriptUploadSize,
  isAudioTranscriptFile,
  isTranscriptionConfigured,
  transcribeAudioFile,
} from '@/lib/ai/transcription';

export async function OPTIONS(request: Request) {
  return liveContextPreflightResponse(request);
}

export async function POST(request: Request) {
  const respond = (res: Response) => withLiveContextCors(res, request);

  const resolved = await resolveExtensionRequestAuth(request);
  if (!resolved?.userId) {
    return respond(Response.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  if (!isTranscriptionConfigured()) {
    return respond(
      Response.json(
        { error: 'Transcription not configured. Set OPENAI_API_KEY or GROQ_API_KEY on the server.' },
        { status: 503 },
      ),
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData ? ((formData.get('audio') ?? formData.get('file')) as File | null) : null;
  if (!(file instanceof File)) {
    return respond(Response.json({ error: 'Audio file is required' }, { status: 400 }));
  }

  if (!isAudioTranscriptFile(file)) {
    return respond(Response.json({ error: 'Unsupported audio type' }, { status: 415 }));
  }

  try {
    assertTranscriptUploadSize(file);
  } catch (sizeError) {
    return respond(
      Response.json(
        { error: sizeError instanceof Error ? sizeError.message : 'File too large' },
        { status: 400 },
      ),
    );
  }

  try {
    const text = await transcribeAudioFile(file);
    return respond(Response.json({ data: { text } }, { status: 200 }));
  } catch (error) {
    console.error('[extension/transcribe] Whisper error', error);
    return respond(
      Response.json(
        { error: error instanceof Error ? error.message : 'Transcription failed' },
        { status: 500 },
      ),
    );
  }
}
