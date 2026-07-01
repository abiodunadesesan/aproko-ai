import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { cookies, headers } from 'next/headers';
import { Suspense } from 'react';
import { ObservabilityProvider } from '@/components/observability-provider';
import { Toaster } from '@/components/ui/toaster';
import { getClerkLocalization } from '@/lib/clerk-localization';
import { LANDING_LOCALE_STORAGE_KEY } from '@/lib/landing-i18n';
import { resolveLandingLocale } from '@/lib/locale/server';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aproko AI',
  description: 'Production-grade AI knowledge operating system',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
  const shouldEnableClerkProvider =
    publishableKey.startsWith('pk_') && !publishableKey.includes('ci_placeholder');

  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = resolveLandingLocale({
    cookieValue: cookieStore.get(LANDING_LOCALE_STORAGE_KEY)?.value,
    acceptLanguage: headerStore.get('accept-language'),
  });

  const appContent = (
    <>
      <Suspense fallback={null}>
        <ObservabilityProvider />
      </Suspense>
      <Toaster />
      {children}
    </>
  );

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('aproko-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);var l=localStorage.getItem('aproko-landing-locale');if(l){document.documentElement.lang=l;document.cookie='aproko-landing-locale='+l+';path=/;max-age=31536000;samesite=lax';}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {shouldEnableClerkProvider ? (
          <ClerkProvider
            localization={getClerkLocalization(locale)}
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
          >
            {appContent}
          </ClerkProvider>
        ) : (
          appContent
        )}
      </body>
    </html>
  );
}
