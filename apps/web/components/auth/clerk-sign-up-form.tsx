'use client';

import { SignUp } from '@clerk/nextjs';
import { getClerkAppearance } from '@/lib/clerk-appearance';
import { useDocumentTheme } from '@/lib/theme';

export function ClerkSignUpForm() {
  const theme = useDocumentTheme();

  return (
    <SignUp
      appearance={getClerkAppearance(theme)}
      fallbackRedirectUrl="/dashboard"
      forceRedirectUrl="/dashboard"
    />
  );
}
