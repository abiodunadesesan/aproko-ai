import { deDE, enUS, esES, frFR, ptBR } from '@clerk/localizations';
import type { LandingLocale } from '@/lib/landing-i18n';

type ClerkLocalization = typeof enUS;

const clerkLocalizationByLocale: Record<LandingLocale, ClerkLocalization> = {
  en: enUS,
  fr: frFR,
  es: esES,
  de: deDE,
  pt: ptBR,
};

export function getClerkLocalization(locale: LandingLocale): ClerkLocalization {
  return clerkLocalizationByLocale[locale];
}

export function parseLandingLocale(value: string | undefined | null): LandingLocale {
  if (value === 'fr' || value === 'es' || value === 'de' || value === 'pt') {
    return value;
  }
  return 'en';
}
