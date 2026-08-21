const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type ExtensionHandoffPayload = {
  userId: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
  exp: number;
};

function getHandoffSecret(): string | null {
  const explicit = process.env.EXTENSION_HANDOFF_SECRET?.trim();
  if (explicit) {
    return explicit;
  }
  const clerkSecret = process.env.CLERK_SECRET_KEY?.trim();
  return clerkSecret || null;
}

export function isExtensionHandoffConfigured(): boolean {
  return Boolean(getHandoffSecret());
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(padLength));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

/**
 * Edge-safe HMAC-SHA256 using Web Crypto when available, with a hard try/catch
 * so token verification never crashes the route isolate.
 */
async function hmacSha256Base64Url(secret: string, body: string): Promise<string | null> {
  try {
    if (!globalThis.crypto?.subtle) {
      return null;
    }
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signature = await globalThis.crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(body),
    );
    return toBase64Url(new Uint8Array(signature));
  } catch {
    return null;
  }
}

export async function createExtensionHandoffToken(input: {
  userId: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
}): Promise<string | null> {
  const secret = getHandoffSecret();
  if (!secret) {
    return null;
  }

  const payload: ExtensionHandoffPayload = {
    userId: input.userId,
    workspaceId: input.workspaceId,
    workspaceName: input.workspaceName,
    role: input.role,
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacSha256Base64Url(secret, body);
  if (!signature) {
    return null;
  }
  return `${body}.${signature}`;
}

export async function verifyExtensionHandoffToken(
  token: string,
): Promise<ExtensionHandoffPayload | null> {
  try {
    const secret = getHandoffSecret();
    if (!secret) {
      return null;
    }

    const [body, signature] = token.split('.');
    if (!body || !signature) {
      return null;
    }

    const expected = await hmacSha256Base64Url(secret, body);
    if (!expected) {
      return null;
    }

    const actualBytes = fromBase64Url(signature);
    const expectedBytes = fromBase64Url(expected);
    if (!timingSafeEqualBytes(actualBytes, expectedBytes)) {
      return null;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as ExtensionHandoffPayload;
    if (
      !payload.userId ||
      !payload.workspaceId ||
      !payload.exp ||
      typeof payload.exp !== 'number' ||
      payload.exp < Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
