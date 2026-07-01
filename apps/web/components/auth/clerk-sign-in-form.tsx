'use client';

import { SignIn } from '@clerk/nextjs';
import { getClerkAppearance } from '@/lib/clerk-appearance';
import { POST_AUTH_REDIRECT_PATH } from '@/lib/auth/post-auth-redirect';
import { useDocumentTheme } from '@/lib/theme';

export function ClerkSignInForm() {
  const theme = useDocumentTheme();

  return (
    <SignIn
      appearance={getClerkAppearance(theme)}
      fallbackRedirectUrl={POST_AUTH_REDIRECT_PATH}
      forceRedirectUrl={POST_AUTH_REDIRECT_PATH}
      path="/sign-in"
      routing="path"
      signUpUrl="/sign-up"
    />
  );
}
