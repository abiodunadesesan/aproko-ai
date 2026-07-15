'use client';

import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { PostHogClerkIdentify } from '@/components/observability/posthog-clerk-identify';
import { getClerkLocalization } from '@/lib/clerk-localization';
import type { LandingLocale } from '@/lib/landing-i18n';
import { POST_AUTH_REDIRECT_PATH } from '@/lib/auth/post-auth-redirect';

type ClerkProviderShellProps = {
  children: ReactNode;
  locale: LandingLocale;
};

export function ClerkProviderShell({ children, locale }: ClerkProviderShellProps) {
  return (
    <ClerkProvider
      localization={getClerkLocalization(locale)}
      signInFallbackRedirectUrl={POST_AUTH_REDIRECT_PATH}
      signInForceRedirectUrl={POST_AUTH_REDIRECT_PATH}
      signUpFallbackRedirectUrl={POST_AUTH_REDIRECT_PATH}
      signUpForceRedirectUrl={POST_AUTH_REDIRECT_PATH}
    >
      <PostHogClerkIdentify />
      {children}
    </ClerkProvider>
  );
}
