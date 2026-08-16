'use client';

import { SignUp } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { getClerkAppearance } from '@/lib/clerk-appearance';
import {
  POST_AUTH_REDIRECT_PATH,
  sanitizePostAuthRedirect,
} from '@/lib/auth/post-auth-redirect';
import { useDocumentTheme } from '@/lib/theme';

export function ClerkSignUpForm() {
  const theme = useDocumentTheme();
  const searchParams = useSearchParams();
  const redirectUrl = sanitizePostAuthRedirect(
    searchParams.get('redirect_url') ?? POST_AUTH_REDIRECT_PATH,
  );

  return (
    <SignUp
      appearance={getClerkAppearance(theme)}
      fallbackRedirectUrl={redirectUrl}
      forceRedirectUrl={redirectUrl}
      path="/sign-up"
      routing="path"
      signInUrl={
        redirectUrl === POST_AUTH_REDIRECT_PATH
          ? '/sign-in'
          : `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
      }
    />
  );
}
