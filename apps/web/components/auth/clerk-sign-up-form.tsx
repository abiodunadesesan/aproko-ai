'use client';

import { SignUp } from '@clerk/nextjs';
import { getClerkAppearance } from '@/lib/clerk-appearance';
import { POST_AUTH_REDIRECT_PATH } from '@/lib/auth/post-auth-redirect';
import { useDocumentTheme } from '@/lib/theme';

export function ClerkSignUpForm() {
  const theme = useDocumentTheme();

  return (
    <SignUp
      appearance={getClerkAppearance(theme)}
      fallbackRedirectUrl={POST_AUTH_REDIRECT_PATH}
      forceRedirectUrl={POST_AUTH_REDIRECT_PATH}
      path="/sign-up"
      routing="path"
      signInUrl="/sign-in"
    />
  );
}
