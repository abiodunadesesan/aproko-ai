const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const AUDIO_EXTENSIONS = new Set(['webm', 'mp3', 'wav', 'm4a', 'ogg', 'mpeg', 'mp4', 'mpga']);

type TranscriptionProvider = {
  id: 'groq' | 'openai';
  apiKey: string;
  url: string;
  model: string;
};

export function isAudioTranscriptFile(file: File): boolean {
  if (file.type.startsWith('audio/')) {
    return true;
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return AUDIO_EXTENSIONS.has(ext);
}

export function isTextTranscriptFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ['txt', 'md', 'markdown', 'vtt', 'srt'].includes(ext) || file.type.startsWith('text/');
}

export function assertTranscriptUploadSize(file: File): void {
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error('File exceeds the 25MB limit');
  }
}

function listTranscriptionProviders(): TranscriptionProvider[] {
  const providers: TranscriptionProvider[] = [];
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    providers.push({
      id: 'groq',
      apiKey: groqKey,
      url: 'https://api.groq.com/openai/v1/audio/transcriptions',
      model: 'whisper-large-v3-turbo',
    });
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    providers.push({
      id: 'openai',
      apiKey: openaiKey,
      url: 'https://api.openai.com/v1/audio/transcriptions',
      model: 'whisper-1',
    });
  }

  return providers;
}

export function isTranscriptionConfigured(): boolean {
  return listTranscriptionProviders().length > 0;
}

async function transcribeWithProvider(
  provider: TranscriptionProvider,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, file.name || 'recording.webm');
  formData.append('model', provider.model);
  formData.append('response_format', 'text');

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail.trim()
        ? `${provider.id} transcription failed: ${detail.slice(0, 240)}`
        : `${provider.id} transcription failed (${response.status})`,
    );
  }

  const text = (await response.text()).trim();
  if (!text) {
    throw new Error(`${provider.id} transcription returned empty text`);
  }

  return text;
}

export async function transcribeAudioFile(file: File): Promise<string> {
  const providers = listTranscriptionProviders();
  if (providers.length === 0) {
    throw new Error(
      'Speech-to-text is not configured. Set GROQ_API_KEY (preferred) or OPENAI_API_KEY on the server.',
    );
  }

  assertTranscriptUploadSize(file);

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      return await transcribeWithProvider(provider, file);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(errors[0] ?? 'Transcription failed');
}
