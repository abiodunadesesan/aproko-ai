'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  MessageSquareText,
  Mic,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const features = [
  {
    title: 'AI overlay, not tab switching',
    copy: 'Keep context from the work already on your screen and ask in place.',
    icon: MessageSquareText,
  },
  {
    title: 'Live capture + memory',
    copy: 'Transcripts, notes, and key facts are saved and reusable across sessions.',
    icon: Mic,
  },
  {
    title: 'Study outputs in one click',
    copy: 'Generate summaries, flashcards, and quizzes from your own materials.',
    icon: BookOpenCheck,
  },
];

const faqs = [
  {
    question: 'What is Aproko AI?',
    answer:
      'Aproko AI is a knowledge operating system that helps you capture, search, and reuse your learning and work context.',
  },
  {
    question: 'Is Aproko AI free to start?',
    answer: 'Yes. You can start free, organize your workspace, and upgrade as your usage grows.',
  },
  {
    question: 'What makes it different from a regular chat app?',
    answer:
      'Aproko AI combines chat with memory, document context, and study workflows so answers stay grounded in your own data.',
  },
];

const stats = [
  { label: 'Knowledge sources indexed', value: '10k+' },
  { label: 'Memory events captured', value: '250k+' },
  { label: 'Learners and teams onboarded', value: '1,200+' },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.purple.500/20),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_bottom,theme(colors.violet.500/20),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6 sm:pb-12 sm:pt-8">
        <header className="sticky top-3 z-20 sm:top-4">
          <nav className="mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full border border-zinc-800 bg-black/70 px-3 py-2 backdrop-blur-xl sm:gap-3 sm:px-4">
            <Link
              className="shrink-0 text-sm font-semibold tracking-tight text-zinc-100 sm:text-base"
              href="/"
            >
              Aproko AI
            </Link>
            <div className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
              <Link className="transition-colors hover:text-zinc-100" href="/billing">
                Pricing
              </Link>
              <Link className="transition-colors hover:text-zinc-100" href="/dashboard">
                Dashboard
              </Link>
              <Link className="transition-colors hover:text-zinc-100" href="/library">
                Library
              </Link>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Button
                asChild
                className="rounded-full px-2.5 text-zinc-200 hover:bg-zinc-900 hover:text-zinc-100 sm:px-3"
                size="sm"
                variant="ghost"
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-emerald-500 px-2.5 text-black hover:bg-emerald-400 sm:px-3"
                size="sm"
              >
                <Link href="/sign-up">
                  <span className="sm:hidden">Start</span>
                  <span className="hidden sm:inline">Start free</span>
                  <ArrowRight className="ml-1 hidden h-4 w-4 sm:inline" />
                </Link>
              </Button>
            </div>
          </nav>
        </header>

        <section className="pt-10 text-center sm:pt-16 md:pt-20">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Badge
              className="max-w-[92vw] whitespace-normal border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] text-zinc-200 sm:max-w-none sm:text-xs"
              variant="secondary"
            >
              AI Knowledge Operating System
            </Badge>
            <h1 className="mx-auto mt-5 max-w-4xl text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-zinc-100 sm:mt-6 sm:text-5xl sm:leading-[1.05] md:text-7xl">
              AI that sees, hears,
              <br className="hidden xs:block" />
              <span className="sm:hidden"> </span>
              and remembers everything.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl px-1 text-sm leading-relaxed text-zinc-400 sm:mt-5 sm:px-0 sm:text-base md:text-lg">
              Aproko AI captures your workspace context, stores memory over time, and helps you turn
              knowledge into reliable outputs.
            </p>
            <div className="mt-7 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center">
              <Button
                asChild
                className="w-full rounded-full bg-zinc-100 px-6 text-black hover:bg-zinc-200 sm:w-auto"
                size="lg"
              >
                <Link href="/sign-up">
                  <span className="sm:hidden">Start free</span>
                  <span className="hidden sm:inline">Download — start free</span>
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="w-full rounded-full border-zinc-700 text-zinc-100 hover:bg-zinc-900 sm:w-auto"
                size="lg"
                variant="outline"
              >
                <Link href="/sign-in">Open existing workspace</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        <section className="mt-10 sm:mt-12">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80 sm:rounded-2xl"
            initial={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
          >
            <div className="border-b border-zinc-800 px-3 py-2.5 sm:px-4 sm:py-3">
              <p className="text-sm font-medium text-zinc-100">Overlay assistant demo</p>
              <p className="text-xs leading-relaxed text-zinc-400">
                Ask about anything on screen — context updates automatically.
              </p>
            </div>
            <div className="grid gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-zinc-800 bg-zinc-900/70">
                <CardHeader className="space-y-0 p-4 pb-2 sm:p-6">
                  <CardTitle className="text-base text-zinc-100">Context panel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0 text-sm text-zinc-400 sm:p-6 sm:pt-0">
                  <p className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
                    Automatic capture
                  </p>
                  <p className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
                    Ask in plain English
                  </p>
                  <p className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
                    Private by default
                  </p>
                </CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900/70">
                <CardHeader className="space-y-0 p-4 pb-2 sm:p-6">
                  <CardTitle className="text-base text-zinc-100">Aproko Chat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0 text-sm text-zinc-400 sm:p-6 sm:pt-0">
                  <p className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
                    “Summarize what’s on my screen and save it to memory.”
                  </p>
                  <p className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-300">
                    Saved to memory. Ready to reuse later.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </section>

        <section className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 sm:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 8 }}
              key={feature.title}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card className="h-full border-zinc-800 bg-zinc-900/60 text-zinc-100">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-start gap-2 text-sm leading-snug sm:items-center sm:text-base">
                    <feature.icon className="h-4 w-4 text-emerald-400" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm leading-relaxed text-zinc-400 sm:p-6 sm:pt-0">
                  {feature.copy}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="mt-8 grid gap-2.5 sm:mt-10 sm:grid-cols-3 sm:gap-3">
          {stats.map((stat, idx) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 sm:px-4 sm:py-3"
              initial={{ opacity: 0, y: 8 }}
              key={stat.label}
              transition={{ duration: 0.3, delay: 0.1 + idx * 0.04 }}
            >
              <p className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                {stat.value}
              </p>
              <p className="text-[11px] leading-snug text-zinc-400 sm:text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </section>

        <section className="mt-10 grid gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-zinc-800 bg-zinc-900/50 text-zinc-100">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Built for focused knowledge work</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2.5 p-4 pt-0 text-sm text-zinc-300 sm:gap-3 sm:p-6 sm:pt-0 sm:grid-cols-2">
              {[
                { text: 'Capture and structure notes in one workspace', icon: CheckCircle2 },
                { text: 'Search across documents, memory, and chats', icon: Sparkles },
                { text: 'Track context with timeline-aware memory', icon: Brain },
                { text: 'Private-by-default architecture', icon: Shield },
              ].map((item) => (
                <p className="flex items-start gap-2" key={item.text}>
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{item.text}</span>
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50 text-zinc-100">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Simple pricing, no surprises</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-sm text-zinc-400">
                Start free. Upgrade when you want higher limits and advanced workflows.
              </p>
              <Separator className="my-4 bg-zinc-800" />
              <div className="space-y-2 text-sm text-zinc-300">
                <p>Free — core workspace and memory baseline</p>
                <p>Pro — unlimited queries and advanced study tools</p>
                <p>Teams — shared knowledge workspaces</p>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild className="rounded-full bg-zinc-100 text-black hover:bg-zinc-200">
                  <Link href="/sign-up">Create free account</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-full border-zinc-700 text-zinc-100 hover:bg-zinc-900"
                  variant="outline"
                >
                  <Link href="/billing">View pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 sm:mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl md:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
            {faqs.map((faq) => (
              <Card className="border-zinc-800 bg-zinc-900/50 text-zinc-100" key={faq.question}>
                <CardHeader className="space-y-0 p-4 pb-2 sm:p-6">
                  <CardTitle className="text-sm leading-snug sm:text-base">
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm leading-relaxed text-zinc-400 sm:p-6 sm:pt-0">
                  {faq.answer}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <footer className="mt-10 border-t border-zinc-800 py-5 text-center text-xs text-zinc-500 sm:mt-12 sm:text-left">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-2">
            <p className="max-w-xs leading-relaxed sm:max-w-none">
              Aproko AI — intelligence that follows your work everywhere.
            </p>
            <div className="flex items-center gap-3">
              <Link className="transition-colors hover:text-zinc-200" href="/sign-in">
                Sign in
              </Link>
              <Link className="transition-colors hover:text-zinc-200" href="/sign-up">
                Start free
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
