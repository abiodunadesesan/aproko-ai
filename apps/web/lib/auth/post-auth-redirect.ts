export const POST_AUTH_REDIRECT_PATH = '/dashboard';

export function isClerkEnabled(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
  return publishableKey.startsWith('pk_') && !publishableKey.includes('ci_placeholder');
}

/**
 * Only allow same-origin relative paths (blocks open redirects).
 * Examples: `/extension/live?embed=1`, `/chat`
 */
export function sanitizePostAuthRedirect(value: string | null | undefined): string {
  if (!value) {
    return POST_AUTH_REDIRECT_PATH;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return POST_AUTH_REDIRECT_PATH;
  }

  try {
    const parsed = new URL(trimmed, 'http://localhost');
    if (parsed.origin !== 'http://localhost') {
      return POST_AUTH_REDIRECT_PATH;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return POST_AUTH_REDIRECT_PATH;
  }
}
