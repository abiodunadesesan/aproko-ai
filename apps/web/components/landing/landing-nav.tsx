'use client';

import Link from 'next/link';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { ArrowRight, Menu } from 'lucide-react';
import { useState } from 'react';
import { AprokoLogo } from '@/components/brand/aproko-logo';
import { LanguageSelector } from '@/components/landing/language-selector';
import { useLandingLocale } from '@/components/landing/locale-provider';
import { LandingThemeToggle } from '@/components/landing/landing-theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

const navLinkClass =
  'rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50';

export function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLandingLocale();

  useMotionValueEvent(scrollY, 'change', (value) => {
    setScrolled(value > 20);
  });

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/blog', label: t.nav.blog },
    { href: '/#pricing', label: t.nav.pricing },
  ];

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
        className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-3 rounded-full border border-zinc-200/80 bg-white/85 px-3.5 py-2 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/90 md:grid-cols-[auto_1fr_auto] md:gap-6 md:px-5 md:py-2"
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <AprokoLogo className="min-w-0" size="sm" />

        <div className="hidden items-center justify-center md:flex">
          <div className="inline-flex items-center gap-0.5 rounded-full border border-zinc-200/80 bg-zinc-100/70 px-1 py-1 dark:border-zinc-800 dark:bg-zinc-900/70">
            {navLinks.map((link) => (
              <Link
                className="rounded-full px-4 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-white hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center justify-end gap-2 md:flex">
          <LanguageSelector compact />
          <LandingThemeToggle />
          <Link
            className="hidden rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-zinc-100 lg:inline-flex"
            href="/sign-in"
          >
            {t.nav.signIn}
          </Link>
          <Button
            asChild
            className="h-8 rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            size="sm"
          >
            <Link href="/sign-up">{t.nav.startFree}</Link>
          </Button>
        </div>

        <div className="flex items-center justify-end gap-1 md:hidden">
          <LanguageSelector compact />
          <LandingThemeToggle />
          <Sheet onOpenChange={setMenuOpen} open={menuOpen}>
            <SheetTrigger asChild>
              <Button
                aria-label="Open menu"
                className="h-9 w-9 rounded-full text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                size="icon"
                variant="ghost"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              className="flex w-[min(100vw-2rem,320px)] flex-col border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
              side="right"
            >
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <AprokoLogo size="sm" />
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link className={navLinkClass} href={link.href}>
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link className={navLinkClass} href="/dashboard">
                    {t.nav.dashboard}
                  </Link>
                </SheetClose>
              </nav>

              <Separator className="my-5 bg-zinc-200 dark:bg-zinc-800" />

              <div className="mt-auto space-y-2 pt-2">
                <SheetClose asChild>
                  <Button asChild className="w-full rounded-full" variant="outline">
                    <Link href="/sign-in">{t.nav.signIn}</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    asChild
                    className="w-full rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                  >
                    <Link href="/sign-up">
                      {t.nav.startFree}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.nav>
    </motion.header>
  );
}
