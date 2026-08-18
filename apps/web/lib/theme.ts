'use client';

import { useEffect, useState } from 'react';

export type AppTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'aproko-theme';

export function getPreferredTheme(): AppTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function isDarkThemeActive(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.documentElement.classList.contains('dark');
}

export function broadcastThemeToExtension(theme: AppTheme) {
  try {
    const maybeChrome = (globalThis as unknown as {
      chrome?: { runtime?: { sendMessage?: unknown } };
    }).chrome;
    const sendMessage = maybeChrome?.runtime?.sendMessage;
    if (typeof sendMessage === 'function') {
      Promise.resolve(sendMessage({ type: 'SET_THEME', theme })).catch(() => {});
    }
  } catch {
    // Ignore in non-extension contexts.
  }
}

export function useDocumentTheme(): AppTheme {
  const [theme, setTheme] = useState<AppTheme>('light');

  useEffect(() => {
    const updateTheme = () => {
      setTheme(isDarkThemeActive() ? 'dark' : 'light');
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = () => updateTheme();
    media.addEventListener('change', onMediaChange);

    return () => {
      observer.disconnect();
      media.removeEventListener('change', onMediaChange);
    };
  }, []);

  return theme;
}
