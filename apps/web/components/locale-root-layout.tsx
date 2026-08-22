import type { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';
import { Suspense } from 'react';
import { ClerkProviderShell } from '@/components/auth/clerk-provider-shell';
import { CookieConsentBanner } from '@/components/cookies/cookie-consent-banner';
import { PostHogProvider } from '@/components/observability/posthog-provider';
import { ObservabilityProvider } from '@/components/observability-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { isClerkEnabled } from '@/lib/auth/post-auth-redirect';
import { aprokoSans } from '@/lib/fonts';
import { LANDING_LOCALE_STORAGE_KEY } from '@/lib/landing-i18n';
import { resolveLandingLocale } from '@/lib/locale/server';

const themeBootstrapScript = `(function(){try{var t=localStorage.getItem('aproko-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);var l=localStorage.getItem('aproko-landing-locale');if(l){document.documentElement.lang=l;document.cookie='aproko-landing-locale='+l+';path=/;max-age=31536000;samesite=lax';}}catch(e){}})();`;

type LocaleRootLayoutProps = {
  children: ReactNode;
};

function LocaleRootLayoutFallback({ children }: LocaleRootLayoutProps) {
  return (
    <html className={aprokoSans.variable} lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <PostHogProvider>
            {isClerkEnabled() ? (
              <ClerkProviderShell locale="en">{children}</ClerkProviderShell>
            ) : (
              children
            )}
            <CookieConsentBanner />
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

async function LocaleRootLayout({ children }: LocaleRootLayoutProps) {
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
    <html className={aprokoSans.variable} lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <PostHogProvider>
            {isClerkEnabled() ? (
              <ClerkProviderShell locale={locale}>{appContent}</ClerkProviderShell>
            ) : (
              appContent
            )}
            <CookieConsentBanner />
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export function LocaleRootLayoutShell({ children }: LocaleRootLayoutProps) {
  return (
    <Suspense fallback={<LocaleRootLayoutFallback>{children}</LocaleRootLayoutFallback>}>
      <LocaleRootLayout>{children}</LocaleRootLayout>
    </Suspense>
  );
}
