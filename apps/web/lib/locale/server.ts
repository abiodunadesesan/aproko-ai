import { parseLandingLocale } from '@/lib/clerk-localization';
import type { LandingLocale } from '@/lib/landing-i18n';

const ACCEPT_LANGUAGE_LOCALES: Array<{ prefix: string; locale: LandingLocale }> = [
  { prefix: 'fr', locale: 'fr' },
  { prefix: 'es', locale: 'es' },
  { prefix: 'de', locale: 'de' },
  { prefix: 'pt', locale: 'pt' },
];

function parseAcceptLanguage(header: string | null | undefined): LandingLocale | null {
  if (!header) {
    return null;
  }

  const candidates = header
    .split(',')
    .map((part) => part.trim().split(';')[0]?.toLowerCase())
    .filter(Boolean);

  for (const candidate of candidates) {
    const match = ACCEPT_LANGUAGE_LOCALES.find(({ prefix }) => candidate?.startsWith(prefix));
    if (match) {
      return match.locale;
    }
  }

  return null;
}

export function resolveLandingLocale(options: {
  cookieValue?: string | null | undefined;
  acceptLanguage?: string | null | undefined;
}): LandingLocale {
  if (options.cookieValue) {
    return parseLandingLocale(options.cookieValue);
  }

  return parseAcceptLanguage(options.acceptLanguage) ?? 'en';
}
