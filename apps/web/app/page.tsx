'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, CheckCircle2, MessageSquareText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const features = [
  {
    title: 'Ask with context',
    copy: 'Chat with workspace memory, citations, and saved project knowledge.',
    icon: MessageSquareText,
  },
  {
    title: 'Remember over time',
    copy: 'Turn notes, docs, and sessions into timeline memory you can reuse instantly.',
    icon: Brain,
  },
  {
    title: 'Study faster',
    copy: 'Generate summaries, flashcards, and quizzes from your own materials.',
    icon: Sparkles,
  },
];

const stats = [
  { label: 'Knowledge sources indexed', value: '10k+' },
  { label: 'Study actions generated', value: '250k+' },
  { label: 'Teams and learners onboarded', value: '1,200+' },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.indigo.500/20),transparent_45%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex items-center justify-between rounded-xl border bg-card/70 px-4 py-3 backdrop-blur">
          <Link className="text-sm font-semibold tracking-tight sm:text-base" href="/">
            Aproko AI
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild size="sm" variant="ghost">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Start free</Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <Badge variant="secondary">AI Knowledge Operating System</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Study, research, and think faster without losing context.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Aproko AI helps you capture what matters, search it instantly, and turn it into
              reliable outputs for work and learning.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Get started
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-in">Open existing workspace</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-card/70 p-4 backdrop-blur sm:p-5"
            initial={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
          >
            <p className="text-sm font-medium">Workspace Snapshot</p>
            <Separator className="my-3" />
            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Today’s focus</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  Review AI memory highlights and continue your active chat session.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent activity</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  3 new notes captured, 2 flashcard decks updated, 1 research workspace synced.
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-3 py-2 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 8 }}
              key={feature.title}
              transition={{ duration: 0.3, delay: 0.05 * idx }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <feature.icon className="h-4 w-4 text-primary" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{feature.copy}</CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-3 py-4 sm:grid-cols-3">
          {stats.map((stat, idx) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-card/60 px-4 py-3 text-center sm:text-left"
              initial={{ opacity: 0, y: 8 }}
              key={stat.label}
              transition={{ duration: 0.3, delay: 0.08 + idx * 0.04 }}
            >
              <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-4 py-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Built for focused knowledge work</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                'Capture and structure notes in one workspace',
                'Search across documents, memory, and chats',
                'Track context with timeline-aware memory',
                'Turn content into study outputs quickly',
              ].map((item) => (
                <p className="flex items-start gap-2" key={item}>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Simple start</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Start with your core workspace and scale features as your knowledge base grows.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild>
                  <Link href="/sign-up">Create free account</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="border-t py-5 text-xs text-muted-foreground">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p>Aproko AI — your AI knowledge operating system.</p>
            <div className="flex items-center gap-3">
              <Link className="hover:text-foreground" href="/sign-in">
                Sign in
              </Link>
              <Link className="hover:text-foreground" href="/sign-up">
                Get started
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
