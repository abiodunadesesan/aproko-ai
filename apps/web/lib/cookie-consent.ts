export const COOKIE_CONSENT_STORAGE_KEY = 'aproko-cookie-consent';

export type CookieConsentPreferences = {
  necessary: true;
  analytics: boolean;
  updatedAt: string;
};

export type CookieConsentChoice = 'accepted' | 'rejected' | 'custom';

export function readCookieConsent(): CookieConsentPreferences | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<CookieConsentPreferences>;
    if (typeof parsed.analytics !== 'boolean') {
      return null;
    }
    return {
      necessary: true,
      analytics: parsed.analytics,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeCookieConsent(analytics: boolean): CookieConsentPreferences {
  const next: CookieConsentPreferences = {
    necessary: true,
    analytics,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent('aproko-cookie-consent-changed', {
        detail: next,
      }),
    );
  }

  return next;
}

export function hasAnalyticsConsent(preferences: CookieConsentPreferences | null): boolean {
  return Boolean(preferences?.analytics);
}
