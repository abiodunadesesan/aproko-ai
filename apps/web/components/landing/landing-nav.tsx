'use client';

import Link from 'next/link';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

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
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.45)' : '0 0 0 rgba(0,0,0,0)',
          borderColor: scrolled ? 'rgb(63 63 70)' : 'rgb(39 39 42)',
        }}
        className="mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-2 backdrop-blur-xl sm:gap-3 sm:px-4"
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <Link
          className="shrink-0 text-sm font-semibold tracking-tight text-zinc-100 sm:text-base"
          href="/"
        >
          Aproko AI
        </Link>
        <div className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
          <Link className="transition-colors hover:text-zinc-100" href="#dashboard-preview">
            Product
          </Link>
          <Link className="transition-colors hover:text-zinc-100" href="#pricing">
            Pricing
          </Link>
          <Link className="transition-colors hover:text-zinc-100" href="/dashboard">
            Dashboard
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            asChild
            className="rounded-full px-2.5 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 sm:px-3"
            size="sm"
            variant="ghost"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-zinc-100 px-2.5 text-zinc-950 hover:bg-white sm:px-3"
            size="sm"
          >
            <Link href="/sign-up">
              <span className="hidden sm:inline">Start free</span>
              <span className="sm:hidden">Start</span>
              <ArrowRight className="ml-1 hidden h-4 w-4 sm:inline" />
            </Link>
          </Button>
        </div>
      </motion.nav>
    </motion.header>
  );
}
