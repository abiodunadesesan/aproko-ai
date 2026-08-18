'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { AnimatedThemeIcon } from '@/components/animated-theme-icon';
import { Button } from '@/components/ui/button';
import { broadcastThemeToExtension } from '@/lib/theme';

export function LandingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    broadcastThemeToExtension(next);
  }

  return (
    <Button
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="h-8 w-8 rounded-full border-zinc-300 bg-white/90 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800"
      disabled={!mounted}
      onClick={toggleTheme}
      size="icon"
      type="button"
      variant="outline"
    >
      <AnimatedThemeIcon className="h-4 w-4" theme={theme} />
    </Button>
  );
}
