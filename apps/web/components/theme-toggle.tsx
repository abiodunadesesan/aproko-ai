'use client';

import { useEffect, useState } from 'react';
import { getPreferredTheme, THEME_STORAGE_KEY, type AppTheme } from '@/lib/theme';

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<AppTheme>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = getPreferredTheme();
    setTheme(next);
    applyTheme(next);
    setReady(true);
  }, []);

  function toggleTheme() {
    const next: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      aria-label="Toggle theme"
      className="rounded-md border px-3 py-2 text-sm"
      disabled={!ready}
      onClick={toggleTheme}
      type="button"
    >
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
