'use client';

import Link from 'next/link';
import { AprokoLogo } from '@/components/brand/aproko-logo';
import { FadeIn } from '@/components/landing/fade-in';
import { LandingNav } from '@/components/landing/landing-nav';
import { LocaleProvider, useLandingLocale } from '@/components/landing/locale-provider';
import type { LegalPageContent } from '@/lib/legal-content';

type LegalPageProps = {
  content: LegalPageContent;
  breadcrumbKey: 'privacy' | 'terms';
};

function LegalPageShell({ content, breadcrumbKey }: LegalPageProps) {
  const { t } = useLandingLocale();
  const breadcrumbLabel = breadcrumbKey === 'privacy' ? t.footer.privacy : t.footer.terms;

  return (
    <main className="relative min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.zinc.400/6),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,theme(colors.zinc.700/12),transparent_45%)]" />

      <LandingNav />

      <div className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28">
        <FadeIn>
          <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
            <Link
              className="transition-colors hover:text-zinc-800 dark:hover:text-zinc-300"
              href="/"
            >
              {t.nav.home}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-700 dark:text-zinc-300">{breadcrumbLabel}</span>
          </nav>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {t.legal.lastUpdated}: {content.lastUpdated}
          </p>
          <p className="mt-6 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            {content.intro}
          </p>
        </FadeIn>

        <div className="mt-10 space-y-10">
          {content.sections.map((section, index) => (
            <FadeIn delay={index * 0.03} key={section.id}>
              <section id={section.id}>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                  {section.bullets ? (
                    <ul className="list-disc space-y-2 pl-5">
                      {section.bullets.map((bullet) => (
                        <li key={bullet.slice(0, 48)}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            </FadeIn>
          ))}
        </div>

        <FadeIn className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <AprokoLogo size="sm" />
            <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <Link
                className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-100"
                href="/privacy"
              >
                {t.footer.privacy}
              </Link>
              <Link
                className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-100"
                href="/terms"
              >
                {t.footer.terms}
              </Link>
              <Link
                className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-100"
                href="/"
              >
                {t.nav.home}
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}

export function LegalPage(props: LegalPageProps) {
  return (
    <LocaleProvider>
      <LegalPageShell {...props} />
    </LocaleProvider>
  );
}
