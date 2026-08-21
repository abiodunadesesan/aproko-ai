import { auth } from '@clerk/nextjs/server';
import {
  verifyExtensionHandoffToken,
  type ExtensionHandoffPayload,
} from '@/lib/extension/handoff-token';

export type ExtensionRequestAuth = {
  userId: string;
  source: 'clerk' | 'extension-handoff';
  handoff?: ExtensionHandoffPayload;
};

export async function resolveExtensionRequestAuth(
  request?: Request,
): Promise<ExtensionRequestAuth | null> {
  // Prefer the dedicated extension header. Clerk middleware treats Authorization
  // Bearer values as Clerk JWTs and can crash on our handoff tokens.
  if (request) {
    const dedicated = request.headers.get('x-aproko-extension-token')?.trim();
    const authHeader = request.headers.get('Authorization')?.trim();
    const bearerToken =
      authHeader?.startsWith('Bearer ext.') ? authHeader.slice('Bearer ext.'.length) : null;
    const token = dedicated || bearerToken;

    if (token) {
      try {
        const handoff = await verifyExtensionHandoffToken(token);
        if (handoff) {
          return {
            userId: handoff.userId,
            source: 'extension-handoff',
            handoff,
          };
        }
      } catch {
        // Invalid/malformed handoff must not fall through to Clerk auth().
      }
      return null;
    }
  }

  try {
    const { userId } = await auth();
    if (userId) {
      return { userId, source: 'clerk' };
    }
  } catch {
    // auth() can throw when called outside Clerk middleware context
    // (e.g. bearer-only extension requests that bypass Clerk auth).
  }

  return null;
}
