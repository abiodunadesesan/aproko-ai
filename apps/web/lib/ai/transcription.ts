const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const AUDIO_EXTENSIONS = new Set(['webm', 'mp3', 'wav', 'm4a', 'ogg', 'mpeg', 'mp4', 'mpga']);

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

export function isTranscriptionConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function transcribeAudioFile(file: File): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Speech-to-text is not configured. Set OPENAI_API_KEY on the server.');
  }

  assertTranscriptUploadSize(file);

  const formData = new FormData();
  formData.append('file', file, file.name || 'recording.webm');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'text');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail.trim()
        ? `Transcription failed: ${detail.slice(0, 240)}`
        : `Transcription failed (${response.status})`,
    );
  }

  const text = (await response.text()).trim();
  if (!text) {
    throw new Error('Transcription returned empty text');
  }

  return text;
}
