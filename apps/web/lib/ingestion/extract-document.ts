import JSZip from 'jszip';
import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';

export const MAX_SYNC_INGEST_BYTES = 12 * 1024 * 1024;
export const MAX_ASYNC_INGEST_BYTES = 50 * 1024 * 1024;

export type ExtractableSourceKind = 'pdf' | 'text' | 'docx' | 'pptx' | 'image';

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
    ext === 'pptx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return 'pptx';
  }

  if (
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tif', 'tiff', 'bmp'].includes(ext) ||
    Boolean(mimeType?.startsWith('image/'))
  ) {
    return 'image';
  }

  if (
    ['txt', 'md', 'markdown', 'vtt', 'srt', 'csv', 'json'].includes(ext) ||
    mimeType?.startsWith('text/')
  ) {
    return 'text';
  }

  return null;
}

export function shouldUseAsyncIngest(fileSize: number): boolean {
  return fileSize > MAX_SYNC_INGEST_BYTES;
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

export async function extractPptxText(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const slideNumber = (path: string) => Number.parseInt(path.match(/slide(\d+)/)?.[1] ?? '0', 10);
      return slideNumber(a) - slideNumber(b);
    });

  const slideTexts: string[] = [];
  for (const path of slidePaths) {
    const xml = await zip.files[path]?.async('text');
    if (!xml) {
      continue;
    }
    const runs = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)]
      .map((match) => match[1]?.trim())
      .filter(Boolean);
    if (runs.length > 0) {
      slideTexts.push(runs.join(' '));
    }
  }

  return slideTexts.join('\n\n').replace(/\s+/g, ' ').trim();
}

export async function extractDocumentText(input: {
  fileName: string;
  mimeType: string | null;
  buffer: ArrayBuffer;
  allowLarge?: boolean;
}): Promise<string> {
  const kind = resolveExtractableKind(input.fileName, input.mimeType);
  if (!kind) {
    throw new Error('Unsupported document type for text extraction');
  }

  const maxBytes = input.allowLarge ? MAX_ASYNC_INGEST_BYTES : MAX_SYNC_INGEST_BYTES;
  if (input.buffer.byteLength > maxBytes) {
    throw new Error('File is too large for text extraction');
  }

  if (kind === 'pdf') {
    const extracted = await extractPdfText(input.buffer);
    if (!extracted) {
      throw new Error('scanned_pdf_requires_ocr');
    }
    return extracted;
  }

  if (kind === 'docx') {
    return extractDocxText(input.buffer);
  }

  if (kind === 'pptx') {
    const extracted = await extractPptxText(input.buffer);
    if (!extracted) {
      throw new Error('Document is empty');
    }
    return extracted;
  }

  if (kind === 'image') {
    throw new Error('image_requires_ocr');
  }

  const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(input.buffer));
  const content = decoded.trim();
  if (!content) {
    throw new Error('Document is empty');
  }
  return content;
}
