export const POST_AUTH_REDIRECT_PATH = '/dashboard';

export function isClerkEnabled(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
  return publishableKey.startsWith('pk_') && !publishableKey.includes('ci_placeholder');
}
