'use client';

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

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LandingLocale>('en');

  useEffect(() => {
    const saved = window.localStorage.getItem(LANDING_LOCALE_STORAGE_KEY);
    if (saved === 'en' || saved === 'fr' || saved === 'es' || saved === 'de' || saved === 'pt') {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = useCallback((next: LandingLocale) => {
    setLocaleState(next);
    window.localStorage.setItem(LANDING_LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

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
