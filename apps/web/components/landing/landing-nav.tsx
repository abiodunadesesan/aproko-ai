'use client';

import Link from 'next/link';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { AprokoLogo } from '@/components/brand/aproko-logo';
import { LanguageSelector } from '@/components/landing/language-selector';
import { useLandingLocale } from '@/components/landing/locale-provider';
import { LandingThemeToggle } from '@/components/landing/landing-theme-toggle';
import { Button } from '@/components/ui/button';

export function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLandingLocale();

  useMotionValueEvent(scrollY, 'change', (value) => {
    setScrolled(value > 20);
  });

  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4"
      initial={{ y: -16, opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.nav
        animate={{
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.12)' : '0 0 0 rgba(0,0,0,0)',
        }}
        className="mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full border border-zinc-200/80 bg-white/85 px-3 py-2 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/85 sm:gap-3 sm:px-4"
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <AprokoLogo size="sm" />

        <div className="hidden items-center gap-6 text-sm font-medium text-zinc-700 dark:text-zinc-300 md:flex">
          <Link
            className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-50"
            href="#dashboard-preview"
          >
            {t.nav.product}
          </Link>
          <Link
            className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-50"
            href="#pricing"
          >
            {t.nav.pricing}
          </Link>
          <Link
            className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-50"
            href="/dashboard"
          >
            {t.nav.dashboard}
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <LanguageSelector />
          <LandingThemeToggle />
          <Button
            asChild
            className="rounded-full px-2.5 text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 sm:px-3"
            size="sm"
            variant="ghost"
          >
            <Link href="/sign-in">{t.nav.signIn}</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-zinc-900 px-2.5 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white sm:px-3"
            size="sm"
          >
            <Link href="/sign-up">
              <span className="hidden sm:inline">{t.nav.startFree}</span>
              <span className="sm:hidden">{t.nav.start}</span>
              <ArrowRight className="ml-1 hidden h-4 w-4 sm:inline" />
            </Link>
          </Button>
        </div>
      </motion.nav>
    </motion.header>
  );
}
