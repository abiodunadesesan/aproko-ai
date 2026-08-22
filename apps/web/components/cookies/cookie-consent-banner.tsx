'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  hasAnalyticsConsent,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentPreferences,
} from '@/lib/cookie-consent';
import { cn } from '@/lib/utils';

export function CookieConsentBanner() {
  const [preferences, setPreferences] = useState<CookieConsentPreferences | null>(null);
  const [ready, setReady] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setPreferences(readCookieConsent());
    setReady(true);

    function onConsentChanged(event: Event) {
      const detail = (event as CustomEvent<CookieConsentPreferences>).detail;
      if (detail) {
        setPreferences(detail);
      }
    }

    window.addEventListener('aproko-cookie-consent-changed', onConsentChanged);
    return () => window.removeEventListener('aproko-cookie-consent-changed', onConsentChanged);
  }, []);

  if (!ready || preferences) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-[80] border-t border-zinc-200/80 bg-zinc-50/95 p-4 shadow-[0_-12px_40px_rgba(24,24,27,0.08)] backdrop-blur-md',
        'dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-[0_-12px_40px_rgba(0,0,0,0.35)]',
      )}
      role="dialog"
      aria-label="Cookie preferences"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Cookies</p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            We use necessary cookies to keep Aproko signed in and working. Optional analytics cookies
            help us understand product usage. See our{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">
              Privacy Policy
            </Link>
            .
          </p>
          {showDetails ? (
            <ul className="space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
              <li>
                <strong className="font-medium text-zinc-700 dark:text-zinc-300">Necessary</strong> —
                auth, security, preferences (always on)
              </li>
              <li>
                <strong className="font-medium text-zinc-700 dark:text-zinc-300">Analytics</strong> —
                PostHog usage metrics (optional)
              </li>
            </ul>
          ) : (
            <button
              type="button"
              className="text-xs font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
              onClick={() => setShowDetails(true)}
            >
              Cookie details
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreferences(writeCookieConsent(false))}
          >
            Reject optional
          </Button>
          <Button type="button" onClick={() => setPreferences(writeCookieConsent(true))}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useAnalyticsConsent(): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(hasAnalyticsConsent(readCookieConsent()));

    function onConsentChanged(event: Event) {
      const detail = (event as CustomEvent<CookieConsentPreferences>).detail;
      setAllowed(hasAnalyticsConsent(detail ?? null));
    }

    window.addEventListener('aproko-cookie-consent-changed', onConsentChanged);
    return () => window.removeEventListener('aproko-cookie-consent-changed', onConsentChanged);
  }, []);

  return allowed;
}
