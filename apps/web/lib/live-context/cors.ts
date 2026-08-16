import { NextResponse } from 'next/server';

function parseAllowlist(): string[] {
  const fromEnv = (process.env.APROKO_EXTENSION_ORIGIN_ALLOWLIST ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const defaults = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '',
  ].filter(Boolean);

  return [...new Set([...defaults, ...fromEnv])];
}

export function isAllowedLiveContextOrigin(origin: string | null): boolean {
  if (!origin) {
    return false;
  }
  if (
    origin.startsWith('chrome-extension://') ||
    origin.startsWith('safari-web-extension://') ||
    origin.startsWith('safari-extension://')
  ) {
    return true;
  }
  return parseAllowlist().includes(origin.replace(/\/$/, ''));
}

export function liveContextCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin');
  if (!isAllowedLiveContextOrigin(origin)) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin!,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export function liveContextPreflightResponse(request: Request): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: liveContextCorsHeaders(request),
  });
}

export function withLiveContextCors(response: Response, request: Request): Response {
  const cors = liveContextCorsHeaders(request);
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
