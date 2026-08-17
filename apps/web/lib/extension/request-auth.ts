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
  const { userId } = await auth();
  if (userId) {
    return { userId, source: 'clerk' };
  }

  if (!request) {
    return null;
  }

  const authHeader = request.headers.get('Authorization')?.trim();
  if (!authHeader?.startsWith('Bearer ext.')) {
    return null;
  }

  const token = authHeader.slice('Bearer ext.'.length);
  const handoff = verifyExtensionHandoffToken(token);
  if (!handoff) {
    return null;
  }

  return {
    userId: handoff.userId,
    source: 'extension-handoff',
    handoff,
  };
}
