import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Suspense } from 'react';
import { ObservabilityProvider } from '@/components/observability-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aproko AI',
  description: 'Production-grade AI knowledge operating system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
  const shouldEnableClerkProvider =
    publishableKey.startsWith('pk_') && !publishableKey.includes('ci_placeholder');

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('aproko-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);var l=localStorage.getItem('aproko-landing-locale');if(l)document.documentElement.lang=l;}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {shouldEnableClerkProvider ? (
          <ClerkProvider
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
