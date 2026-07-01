'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpenCheck, Globe, Layers, Link2, Search, Shield } from 'lucide-react';
import { BlogSection } from '@/components/landing/blog-section';
import { ChatMockup } from '@/components/landing/chat-mockup';
import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { DocumentDemo } from '@/components/landing/document-demo';
import { AprokoLogo } from '@/components/brand/aproko-logo';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/landing/fade-in';
import { LandingNav } from '@/components/landing/landing-nav';
import { LocaleProvider, useLandingLocale } from '@/components/landing/locale-provider';
import { PricingSection } from '@/components/landing/pricing-section';
import { SocialProof } from '@/components/landing/social-proof';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const memoryStepIcons = [Link2, Search, Shield] as const;
const studyIcons = [BookOpenCheck, Layers, Globe] as const;

export default function LandingPage() {
  return (
    <LocaleProvider>
      <LandingPageContent />
    </LocaleProvider>
  );
}

function LandingPageContent() {
  const { t } = useLandingLocale();

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.amber.400/10),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,theme(colors.zinc.700/15),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_bottom,theme(colors.orange.400/8),transparent_55%)] dark:bg-[radial-gradient(circle_at_bottom,theme(colors.zinc.800/20),transparent_55%)]" />

      <LandingNav />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-20 sm:px-6 sm:pb-12 sm:pt-24">
        {/* Hero + chat demo */}
        <section className="pt-4 text-center sm:pt-8">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="mx-auto max-w-4xl text-[1.65rem] font-semibold leading-[1.12] tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl md:text-5xl lg:text-6xl">
              {t.hero.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base md:text-lg">
              {t.hero.subtitle}
            </p>
            <div className="mt-8 sm:mt-10">
              <ChatMockup variant="hero" />
            </div>
          </motion.div>
        </section>

        {/* Dashboard preview */}
        <section className="mt-16 scroll-mt-28 sm:mt-20" id="dashboard-preview">
          <FadeIn className="text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              {t.dashboard.eyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-3xl md:text-4xl">
              {t.dashboard.title}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
              {t.dashboard.subtitle}
            </p>
          </FadeIn>
          <div className="mt-8 sm:mt-10">
            <DashboardPreview />
          </div>
        </section>

        {/* Knowledge layer */}
        <section className="mt-16 sm:mt-20">
          <FadeIn className="text-center">
            <h2 className="mx-auto max-w-3xl text-2xl font-semibold leading-tight text-zinc-600 dark:text-zinc-300 sm:text-3xl md:text-4xl">
              {t.workflow.title}{' '}
              <span className="text-zinc-900 dark:text-zinc-100">{t.workflow.titleAccent}</span>
            </h2>
          </FadeIn>
          <StaggerContainer className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
            {t.workflow.items.map((item) => (
              <StaggerItem key={item.title}>
                <Card className="h-full border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 transition-colors hover:border-zinc-700">
                  <CardHeader className="p-4 pb-1 sm:p-5">
                    <CardTitle className="text-sm sm:text-base">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:p-5 sm:pt-0">
                    {item.copy}
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Perfect memory */}
        <section className="mt-16 grid gap-8 sm:mt-20 lg:grid-cols-2 lg:items-center lg:gap-12">
          <FadeIn>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              {t.memory.eyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl md:text-4xl">
              {t.memory.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
              {t.memory.subtitle}
            </p>
            <div className="mt-8 space-y-6">
              {t.memory.steps.map((step, idx) => {
                const Icon = memoryStepIcons[idx] ?? Link2;
                return (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4"
                    initial={{ opacity: 0, x: -12 }}
                    key={step.num}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    viewport={{ once: true }}
                    whileInView={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-zinc-500">{step.num}</span>
                      <Icon className="h-4 w-4 text-zinc-400 dark:text-zinc-300" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {step.copy}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <ChatMockup variant="memory" />
          </FadeIn>
        </section>

        {/* Document intelligence */}
        <section className="mt-16 sm:mt-20">
          <FadeIn>
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold leading-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl md:text-4xl">
                {t.documents.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
                {t.documents.subtitle}
              </p>
            </div>
          </FadeIn>
          <FadeIn className="mt-8" delay={0.08}>
            <DocumentDemo />
          </FadeIn>
          <StaggerContainer className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {t.documents.items.map((item) => (
              <StaggerItem key={item.title}>
                <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
                  <CardHeader className="p-4 pb-1">
                    <CardTitle className="text-sm">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm text-zinc-700 dark:text-zinc-300">
                    {item.copy}
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Natural language ask */}
        <section className="mt-16 sm:mt-20">
          <FadeIn>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              {t.ask.eyebrow}
            </p>
            <h2 className="mt-2 max-w-xl text-2xl font-semibold leading-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {t.ask.title}
            </h2>
            <Card className="mt-6 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 sm:mt-8">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                  <span className="text-zinc-700 dark:text-zinc-300">{t.ask.ready}</span>
                  <span className="text-zinc-500">{t.ask.via}</span>
                </div>
                <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm italic text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                  &ldquo;{t.ask.question}&rdquo;
                </p>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {t.ask.answerPrefix}
                  </span>{' '}
                  {t.ask.answer}
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        </section>

        {/* Comparison */}
        <section className="mt-16 sm:mt-20">
          <FadeIn>
            <h2 className="text-2xl font-semibold leading-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl md:text-4xl">
              {t.compare.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
              {t.compare.subtitle}
            </p>
          </FadeIn>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <FadeIn delay={0.05}>
              <Card className="h-full border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm text-zinc-700 dark:text-zinc-300">
                    {t.compare.standardTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0 text-sm text-zinc-500">
                  {t.compare.standardSteps.map((step) => (
                    <p
                      className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                      key={step}
                    >
                      {step}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.1}>
              <Card className="h-full border-zinc-300 bg-zinc-50 dark:border-zinc-500/30 dark:bg-zinc-900/80">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">
                    {t.compare.aprokoTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0 text-sm text-zinc-700 dark:text-zinc-300">
                  {t.compare.aprokoSteps.map((step) => (
                    <p
                      className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800/60"
                      key={step}
                    >
                      {step}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </section>

        {/* Feature stack */}
        <section className="mt-16 sm:mt-20">
          <StaggerContainer className="space-y-3">
            {t.features.map((feature, idx) => (
              <StaggerItem key={feature.title}>
                <Card
                  className={`border-zinc-200 bg-white transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 ${
                    idx === 2
                      ? 'border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/80'
                      : 'dark:bg-zinc-900/50'
                  }`}
                >
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:p-6 sm:pt-0">
                    {feature.copy}
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Study outputs */}
        <section className="mt-12 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {t.study.map((feature, idx) => {
            const Icon = studyIcons[idx] ?? BookOpenCheck;
            return (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 8 }}
                key={feature.title}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <Card className="h-full border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-start gap-2 text-sm sm:items-center sm:text-base">
                      <Icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-300" />
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm text-zinc-700 dark:text-zinc-300 sm:p-6 sm:pt-0">
                    {feature.copy}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </section>

        <SocialProof />

        <section className="mt-16 sm:mt-20">
          <FadeIn>
            <PricingSection mode="landing" />
          </FadeIn>
        </section>

        <BlogSection />

        {/* CTA banner */}
        <section className="mt-16 sm:mt-20" id="get-started">
          <FadeIn>
            <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:px-10 sm:py-14">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                {t.cta.eyebrow}
              </p>
              <h2 className="mx-auto mt-3 max-w-xl text-2xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                {t.cta.titleLine1}{' '}
                <span className="text-zinc-500 dark:text-zinc-400">{t.cta.titleLine2}</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
                {t.cta.subtitle}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Button
                  asChild
                  className="h-10 rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                  size="lg"
                >
                  <Link href="/sign-up">{t.cta.button}</Link>
                </Button>
                <Button
                  asChild
                  className="h-10 rounded-full border border-zinc-300 bg-transparent px-6 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  size="lg"
                  variant="outline"
                >
                  <Link href="#pricing">{t.nav.pricing}</Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* FAQ */}
        <section className="mt-16 sm:mt-20">
          <FadeIn className="text-center">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {t.faq.title}
            </h2>
          </FadeIn>
          <div className="mx-auto mt-10 max-w-3xl space-y-8">
            {t.faq.items.map((faq, idx) => (
              <FadeIn delay={idx * 0.04} key={faq.question}>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
                  {faq.answer}
                </p>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800 sm:mt-20">
          <FadeIn>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <AprokoLogo size="sm" />
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-500">
                  {t.footer.tagline}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  {t.footer.company}
                </p>
                <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <Link
                    className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-100"
                    href="/sign-up"
                  >
                    {t.footer.about}
                  </Link>
                  <Link
                    className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-100"
                    href="/blog"
                  >
                    {t.footer.blog}
                  </Link>
                  <Link
                    className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-100"
                    href="#pricing"
                  >
                    {t.footer.pricing}
                  </Link>
                  <Link
                    className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-100"
                    href="/sign-in"
                  >
                    {t.footer.signIn}
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  {t.footer.stayUpdated}
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500">
                  {t.footer.newsletter}
                </p>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                  }}
                >
                  <Input
                    aria-label="Email address"
                    className="border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                    placeholder={t.footer.emailPlaceholder}
                    type="email"
                  />
                  <Button
                    aria-label="Subscribe to updates"
                    className="shrink-0 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                    type="submit"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
            <Separator className="my-8 bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-col items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400 sm:flex-row">
              <p>{t.footer.copyright}</p>
              <div className="flex items-center gap-3">
                <Link
                  className="font-medium text-zinc-800 transition-colors hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
                  href="/sign-in"
                >
                  {t.footer.signIn}
                </Link>
                <Link
                  className="font-medium text-zinc-800 transition-colors hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
                  href="/sign-up"
                >
                  {t.footer.startFree}
                </Link>
              </div>
            </div>
          </FadeIn>
        </footer>
      </div>
    </main>
  );
}
