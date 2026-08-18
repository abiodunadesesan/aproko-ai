'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { AnimatedThemeIcon } from '@/components/animated-theme-icon';
import { Button } from '@/components/ui/button';
import { broadcastThemeToExtension } from '@/lib/theme';

export function ThemeToggle() {
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
      className="h-9 w-9 rounded-full"
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
