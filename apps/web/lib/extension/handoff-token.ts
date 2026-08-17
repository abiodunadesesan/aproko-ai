import { createHmac, timingSafeEqual } from 'node:crypto';

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

function signBody(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

export function createExtensionHandoffToken(input: {
  userId: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
}): string | null {
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

  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${signBody(body, secret)}`;
}

export function verifyExtensionHandoffToken(token: string): ExtensionHandoffPayload | null {
  const secret = getHandoffSecret();
  if (!secret) {
    return null;
  }

  const [body, signature] = token.split('.');
  if (!body || !signature) {
    return null;
  }

  const expected = signBody(body, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as ExtensionHandoffPayload;
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
