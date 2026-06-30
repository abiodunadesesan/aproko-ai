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
    { href: '#dashboard-preview', label: t.nav.product },
    { href: '#pricing', label: t.nav.pricing },
    { href: '/dashboard', label: t.nav.dashboard },
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
        className="mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full border border-zinc-200/80 bg-white/85 px-3 py-2 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/85 sm:gap-3 sm:px-4"
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <AprokoLogo size="sm" />

        <div className="hidden items-center gap-6 text-sm font-medium text-zinc-700 dark:text-zinc-300 md:flex">
          {navLinks.map((link) => (
            <Link
              className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-50"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden shrink-0 items-center gap-1.5 md:flex">
          <LanguageSelector />
          <LandingThemeToggle />
          <Button
            asChild
            className="rounded-full px-3 text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            size="sm"
            variant="ghost"
          >
            <Link href="/sign-in">{t.nav.signIn}</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-zinc-900 px-3 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            size="sm"
          >
            <Link href="/sign-up">
              {t.nav.startFree}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Mobile: menu only */}
        <div className="flex items-center md:hidden">
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
              </nav>

              <Separator className="my-5 bg-zinc-200 dark:bg-zinc-800" />

              <div className="space-y-3">
                <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Preferences
                </p>
                <div className="flex items-center gap-2 px-3">
                  <LanguageSelector />
                  <LandingThemeToggle />
                </div>
              </div>

              <div className="mt-auto space-y-2 pt-6">
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
