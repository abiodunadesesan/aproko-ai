'use client';

import { SignIn } from '@clerk/nextjs';
import { getClerkAppearance } from '@/lib/clerk-appearance';
import { useDocumentTheme } from '@/lib/theme';

export function ClerkSignInForm() {
  const theme = useDocumentTheme();

  return (
    <SignIn
      appearance={getClerkAppearance(theme)}
      fallbackRedirectUrl="/dashboard"
      forceRedirectUrl="/dashboard"
    />
  );
}
