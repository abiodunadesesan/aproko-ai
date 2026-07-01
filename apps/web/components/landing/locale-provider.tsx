'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getLandingCopy, LANDING_LOCALE_STORAGE_KEY, type LandingLocale } from '@/lib/landing-i18n';

type LocaleContextValue = {
  locale: LandingLocale;
  setLocale: (locale: LandingLocale) => void;
  t: ReturnType<typeof getLandingCopy>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function persistLocale(locale: LandingLocale) {
  window.localStorage.setItem(LANDING_LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  document.cookie = `${LANDING_LOCALE_STORAGE_KEY}=${locale};path=/;max-age=31536000;samesite=lax`;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<LandingLocale>('en');

  useEffect(() => {
    const saved = window.localStorage.getItem(LANDING_LOCALE_STORAGE_KEY);
    if (saved === 'en' || saved === 'fr' || saved === 'es' || saved === 'de' || saved === 'pt') {
      setLocaleState(saved);
      persistLocale(saved);
    }
  }, []);

  const setLocale = useCallback(
    (next: LandingLocale) => {
      setLocaleState(next);
      persistLocale(next);
      // Defer refresh so React finishes the current render before Next revalidates.
      window.setTimeout(() => {
        router.refresh();
      }, 0);
    },
    [router],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: getLandingCopy(locale),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLandingLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLandingLocale must be used within LocaleProvider');
  }
  return context;
}

export function useOptionalLandingLocale() {
  return useContext(LocaleContext);
}
