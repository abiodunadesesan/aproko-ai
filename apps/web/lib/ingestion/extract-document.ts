import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';

export const MAX_SYNC_INGEST_BYTES = 12 * 1024 * 1024;

export type ExtractableSourceKind = 'pdf' | 'text' | 'docx';

export function resolveExtractableKind(
  fileName: string,
  mimeType: string | null,
): ExtractableSourceKind | null {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }

  if (
    ext === 'docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }

  if (
    ['txt', 'md', 'markdown', 'vtt', 'srt', 'csv', 'json'].includes(ext) ||
    mimeType?.startsWith('text/')
  ) {
    return 'text';
  }

  return null;
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.replace(/\s+/g, ' ').trim();
}

export async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return result.value.replace(/\s+/g, ' ').trim();
}

export async function extractDocumentText(input: {
  fileName: string;
  mimeType: string | null;
  buffer: ArrayBuffer;
}): Promise<string> {
  const kind = resolveExtractableKind(input.fileName, input.mimeType);
  if (!kind) {
    throw new Error('Unsupported document type for text extraction');
  }

  if (input.buffer.byteLength > MAX_SYNC_INGEST_BYTES) {
    throw new Error('File is too large for synchronous text extraction');
  }

  if (kind === 'pdf') {
    return extractPdfText(input.buffer);
  }

  if (kind === 'docx') {
    return extractDocxText(input.buffer);
  }

  const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(input.buffer));
  const content = decoded.trim();
  if (!content) {
    throw new Error('Document is empty');
  }
  return content;
}
