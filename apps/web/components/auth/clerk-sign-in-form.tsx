'use client';

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { getClerkAppearance } from '@/lib/clerk-appearance';
import {
  POST_AUTH_REDIRECT_PATH,
  sanitizePostAuthRedirect,
} from '@/lib/auth/post-auth-redirect';
import { useDocumentTheme } from '@/lib/theme';

export function ClerkSignInForm() {
  const theme = useDocumentTheme();
  const searchParams = useSearchParams();
  const redirectUrl = sanitizePostAuthRedirect(
    searchParams.get('redirect_url') ?? POST_AUTH_REDIRECT_PATH,
  );

  return (
    <SignIn
      appearance={getClerkAppearance(theme)}
      fallbackRedirectUrl={redirectUrl}
      forceRedirectUrl={redirectUrl}
      path="/sign-in"
      routing="path"
      signUpUrl={
        redirectUrl === POST_AUTH_REDIRECT_PATH
          ? '/sign-up'
          : `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`
      }
    />
  );
}
