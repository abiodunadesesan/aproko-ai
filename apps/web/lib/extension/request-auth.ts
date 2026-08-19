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
  // Check bearer token first — extension requests from service workers
  // never have Clerk cookies, and auth() can throw in edge cases.
  if (request) {
    const authHeader = request.headers.get('Authorization')?.trim();
    if (authHeader?.startsWith('Bearer ext.')) {
      const token = authHeader.slice('Bearer ext.'.length);
      const handoff = verifyExtensionHandoffToken(token);
      if (handoff) {
        return {
          userId: handoff.userId,
          source: 'extension-handoff',
          handoff,
        };
      }
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
