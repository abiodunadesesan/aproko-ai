'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpenCheck, Globe, Layers, Link2, Search, Shield } from 'lucide-react';
import { ChatMockup } from '@/components/landing/chat-mockup';
import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { DocumentDemo } from '@/components/landing/document-demo';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/landing/fade-in';
import { LandingNav } from '@/components/landing/landing-nav';
import { PricingSection } from '@/components/landing/pricing-section';
import { SocialProof } from '@/components/landing/social-proof';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const overlayShortcuts = [
  {
    title: 'Quick capture',
    copy: 'Upload documents and transcripts into one workspace — no scattered tabs.',
  },
  {
    title: 'Just ask',
    copy: 'Press ⌘K to search or open chat. Ask in plain language with your library as context.',
  },
  {
    title: 'Instant answer',
    copy: 'Get grounded responses with citations in seconds, not copy-paste cycles.',
  },
];

const memorySteps = [
  {
    num: '01',
    title: 'Automatic capture',
    copy: 'Documents, chats, and study outputs get indexed while you work — no manual filing.',
    icon: Link2,
  },
  {
    num: '02',
    title: 'Ask in plain English',
    copy: 'Ask a question like you would to a colleague. Get a short answer with the source.',
    icon: Search,
  },
  {
    num: '03',
    title: 'Private by default',
    copy: 'Your data stays yours. Workspace isolation, no public feed, no shared index.',
    icon: Shield,
  },
];

const featureStack = [
  {
    title: 'Upload & understand documents',
    copy: 'PDF, DOCX, PPT, and images are parsed, chunked, and searchable with OCR support.',
  },
  {
    title: 'Structured notes with citations',
    copy: 'Every AI answer links back to the source chunk so you can verify and reuse confidently.',
  },
  {
    title: 'Multi-model intelligence',
    copy: 'Route queries across OpenAI, Anthropic, Gemini, and more from one workspace.',
  },
  {
    title: 'Full web ecosystem',
    copy: 'One account across chat, library, memory, research, and study — all synced in the cloud.',
  },
];

const faqs = [
  {
    question: 'What is Aproko AI?',
    answer:
      'Aproko AI is the AI knowledge operating system for students and teams. It helps you upload documents, chat with citations, build long-term memory, and generate study outputs — all in one web workspace.',
  },
  {
    question: 'How is Aproko AI different from ChatGPT or other AI tools?',
    answer:
      'Generic chat apps require you to copy context into a browser tab. Aproko AI is built around your library, memory timeline, and retrieval pipeline — so answers stay grounded in your own materials with source citations.',
  },
  {
    question: 'Is Aproko AI free?',
    answer:
      'Yes. You can start free with core workspace features and limited AI queries — no credit card required. Pro plans unlock unlimited usage and advanced workflows.',
  },
  {
    question: 'What file types does Aproko AI support?',
    answer:
      'PDF, DOCX, PPT, images, and meeting transcripts. Files are parsed, chunked, embedded, and searchable across your workspace library and chat.',
  },
  {
    question: 'Does Aproko AI store my data privately?',
    answer:
      'Yes. Your workspace data is isolated by account. Aproko does not publish a public feed or shared index of your knowledge.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Create a free account, upload your first documents to the library, then open chat or search to ask questions grounded in your materials.',
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.zinc.700/15),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_bottom,theme(colors.zinc.800/20),transparent_55%)]" />

      <LandingNav />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-20 sm:px-6 sm:pb-12 sm:pt-24">
        {/* Hero + chat demo */}
        <section className="pt-4 text-center sm:pt-8">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="mx-auto max-w-4xl text-[1.65rem] font-semibold leading-[1.12] tracking-tight text-zinc-100 sm:text-4xl md:text-5xl lg:text-6xl">
              Aproko AI — AI that sees, hears,
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              and remembers everything.
            </h1>
            <div className="mt-8 sm:mt-10">
              <ChatMockup variant="hero" />
            </div>
          </motion.div>
        </section>

        {/* Dashboard preview */}
        <section className="mt-16 scroll-mt-28 sm:mt-20" id="dashboard-preview">
          <FadeIn className="text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Your workspace
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-100 sm:text-3xl md:text-4xl">
              A dashboard built for knowledge work
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Metrics, recent activity, and quick actions — the same view you get after sign-in.
            </p>
          </FadeIn>
          <div className="mt-8 sm:mt-10">
            <DashboardPreview />
          </div>
        </section>

        {/* Knowledge layer */}
        <section className="mt-16 sm:mt-20">
          <FadeIn className="text-center">
            <h2 className="mx-auto max-w-3xl text-2xl font-semibold leading-tight text-zinc-300 sm:text-3xl md:text-4xl">
              AI knowledge layer on every workflow,{' '}
              <span className="text-zinc-100">helping you stay in flow</span>
            </h2>
          </FadeIn>
          <StaggerContainer className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
            {overlayShortcuts.map((item) => (
              <StaggerItem key={item.title}>
                <Card className="h-full border-zinc-800 bg-zinc-900/60 transition-colors hover:border-zinc-700">
                  <CardHeader className="p-4 pb-1 sm:p-5">
                    <CardTitle className="text-sm sm:text-base">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm leading-relaxed text-zinc-400 sm:p-5 sm:pt-0">
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
              Perfect memory
            </p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl md:text-4xl">
              Intelligence that follows you everywhere
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Aproko remembers your documents, chats, and study outputs — so you can ask questions
              later and get answers with sources.
            </p>
            <div className="mt-8 space-y-6">
              {memorySteps.map((step, idx) => (
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
                    <step.icon className="h-4 w-4 text-zinc-300" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-100">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">{step.copy}</p>
                  </div>
                </motion.div>
              ))}
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
              <h2 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl md:text-4xl">
                Understand every document, remember everything.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Upload PDFs, slides, and transcripts. Search them, summarize them, or turn them into
                notes, flashcards, and quizzes — all in one click.
              </p>
            </div>
          </FadeIn>
          <FadeIn className="mt-8" delay={0.08}>
            <DocumentDemo />
          </FadeIn>
          <StaggerContainer className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              {
                title: 'Live indexing',
                copy: 'See documents become searchable as processing completes.',
              },
              {
                title: 'Summaries & notes',
                copy: 'Generate summaries or action items from any source in one click.',
              },
              {
                title: 'Completely private',
                copy: 'Your files stay in your workspace. Tenant isolation by design.',
              },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader className="p-4 pb-1">
                    <CardTitle className="text-sm">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm text-zinc-400">{item.copy}</CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Natural language ask */}
        <section className="mt-16 sm:mt-20">
          <FadeIn>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">Ask</p>
            <h2 className="mt-2 max-w-xl text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
              Ask in natural language. Stay in flow while you work.
            </h2>
            <Card className="mt-6 border-zinc-800 bg-zinc-900/60 sm:mt-8">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex h-2 w-2 rounded-full bg-zinc-300" />
                  <span className="text-zinc-300">Ready</span>
                  <span className="text-zinc-500">via chat or ⌘K search</span>
                </div>
                <p className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm italic text-zinc-400">
                  &ldquo;Can you walk me through this using what&apos;s in my research
                  workspace?&rdquo;
                </p>
                <p className="text-sm leading-relaxed text-zinc-300">
                  <span className="font-medium text-zinc-100">Aproko:</span> Based on your uploaded
                  sources, here&apos;s a step-by-step breakdown with citations from your library.
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        </section>

        {/* Comparison */}
        <section className="mt-16 sm:mt-20">
          <FadeIn>
            <h2 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl md:text-4xl">
              Generic chat can&apos;t see your knowledge base
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Aproko sits inside your workspace and uses your library, memory, and research context
              automatically.
            </p>
          </FadeIn>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <FadeIn delay={0.05}>
              <Card className="h-full border-zinc-800 bg-zinc-900/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm text-zinc-400">Standard workflow</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0 text-sm text-zinc-500">
                  {[
                    'Open a chat tab',
                    'Copy text from your document',
                    'Paste context manually',
                    'Wait for a response',
                    'Switch back and figure out how to apply it',
                  ].map((step) => (
                    <p
                      className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
                      key={step}
                    >
                      {step}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.1}>
              <Card className="h-full border-zinc-500/30 bg-zinc-900/80">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm text-zinc-100">Aproko AI — 2 steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0 text-sm text-zinc-300">
                  <p className="rounded-md border border-zinc-600 bg-zinc-800/60 px-3 py-2">
                    1. Ask in chat or search
                  </p>
                  <p className="rounded-md border border-zinc-600 bg-zinc-800/60 px-3 py-2">
                    2. Get an answer grounded in your library with citations
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </section>

        {/* Feature stack */}
        <section className="mt-16 sm:mt-20">
          <StaggerContainer className="space-y-3">
            {featureStack.map((feature, idx) => (
              <StaggerItem key={feature.title}>
                <Card
                  className={`border-zinc-800 transition-colors hover:border-zinc-700 ${
                    idx === 2 ? 'border-zinc-600 bg-zinc-900/80' : 'bg-zinc-900/50'
                  }`}
                >
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm leading-relaxed text-zinc-400 sm:p-6 sm:pt-0">
                    {feature.copy}
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Study outputs */}
        <section className="mt-12 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            {
              title: 'Study outputs in one click',
              copy: 'Generate summaries, flashcards, and quizzes from your own materials.',
              icon: BookOpenCheck,
            },
            {
              title: 'Memory timeline',
              copy: 'Track what you learned and when — context that compounds over time.',
              icon: Layers,
            },
            {
              title: 'Research workspace',
              copy: 'Collect sources, notes, and AI synthesis in one focused flow.',
              icon: Globe,
            },
          ].map((feature, idx) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 8 }}
              key={feature.title}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Card className="h-full border-zinc-800 bg-zinc-900/60 transition-colors hover:border-zinc-700">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-start gap-2 text-sm sm:items-center sm:text-base">
                    <feature.icon className="h-4 w-4 shrink-0 text-zinc-300" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-zinc-400 sm:p-6 sm:pt-0">
                  {feature.copy}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <SocialProof />

        <section className="mt-16 sm:mt-20">
          <FadeIn>
            <PricingSection mode="landing" />
          </FadeIn>
        </section>

        {/* CTA banner */}
        <section className="mt-16 sm:mt-20">
          <FadeIn>
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 px-6 py-12 text-center sm:px-10 sm:py-16">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.zinc.700/20),transparent_65%)]" />
              <div className="relative">
                <h2 className="text-2xl font-semibold uppercase tracking-tight text-zinc-100 sm:text-3xl md:text-4xl">
                  Stop switching tabs.
                  <br />
                  Start finishing faster.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                  One workspace for AI answers, document understanding, memory, and study tools.
                  Start free — no card required.
                </p>
                <Button
                  asChild
                  className="mt-6 rounded-full bg-zinc-100 px-8 text-zinc-950 hover:bg-white"
                  size="lg"
                >
                  <Link href="/sign-up">
                    Start free
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* FAQ */}
        <section className="mt-16 sm:mt-20">
          <FadeIn className="text-center">
            <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
              Frequently asked questions about Aproko AI
            </h2>
          </FadeIn>
          <div className="mx-auto mt-10 max-w-3xl space-y-8">
            {faqs.map((faq, idx) => (
              <FadeIn delay={idx * 0.04} key={faq.question}>
                <h3 className="text-base font-semibold text-zinc-100 sm:text-lg">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
                  {faq.answer}
                </p>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-800 pt-10 sm:mt-20">
          <FadeIn>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-zinc-100">Aproko AI</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  AI knowledge operating system — chat, memory, library, and study tools in one web
                  workspace.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Company
                </p>
                <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-400">
                  <Link className="transition-colors hover:text-zinc-200" href="/sign-up">
                    About Aproko AI
                  </Link>
                  <Link className="transition-colors hover:text-zinc-200" href="#pricing">
                    Pricing
                  </Link>
                  <Link className="transition-colors hover:text-zinc-200" href="/sign-in">
                    Sign in
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Stay updated
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Product updates and tips, straight to your inbox.
                </p>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                  }}
                >
                  <Input
                    aria-label="Email address"
                    className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
                    placeholder="you@email.com"
                    type="email"
                  />
                  <Button
                    aria-label="Subscribe to updates"
                    className="shrink-0 rounded-full bg-zinc-100 text-zinc-950 hover:bg-white"
                    type="submit"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
            <Separator className="my-8 bg-zinc-800" />
            <div className="flex flex-col items-center justify-between gap-3 text-xs text-zinc-500 sm:flex-row">
              <p>Aproko AI — intelligence that follows your work everywhere.</p>
              <div className="flex items-center gap-3">
                <Link className="transition-colors hover:text-zinc-200" href="/sign-in">
                  Sign in
                </Link>
                <Link className="transition-colors hover:text-zinc-200" href="/sign-up">
                  Start free
                </Link>
              </div>
            </div>
          </FadeIn>
        </footer>
      </div>
    </main>
  );
}
