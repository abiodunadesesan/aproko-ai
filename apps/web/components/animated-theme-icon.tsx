'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

type AnimatedThemeIconProps = {
  theme: 'light' | 'dark';
  className?: string;
};

export function AnimatedThemeIcon({ theme, className }: AnimatedThemeIconProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return theme === 'dark' ? (
      <Sun className={className} />
    ) : (
      <Moon className={className} />
    );
  }

  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
          exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
          initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
          key={theme}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          {theme === 'dark' ? <Sun className={className} /> : <Moon className={className} />}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
