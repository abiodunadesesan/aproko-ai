'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Grid3x3, Mic, Paperclip, Plus, Send, Settings, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

type ChatMockupProps = {
  variant?: 'hero' | 'memory';
};

const USER_QUESTION =
  'Can you explain how to solve the differential equation in my uploaded notes?';

const ASSISTANT_INTRO = 'This is a first-order linear ODE:';
const ASSISTANT_EQUATION = "y' + 2y = eˣ";

const ASSISTANT_STEPS = [
  'Find the integrating factor μ(x) = e^(∫2 dx) = e^(2x)',
  'Multiply both sides by μ(x)',
  'Integrate and solve for y',
  'Apply initial conditions if provided',
];

type HeroPhase = 'idle' | 'typing' | 'sent' | 'thinking' | 'answer' | 'done';

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

function TypingDots() {
  return (
    <div aria-hidden="true" className="flex items-center gap-1 px-1 py-2">
      {[0, 1, 2].map((index) => (
        <motion.span
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
          className="h-1.5 w-1.5 rounded-full bg-zinc-500"
          key={index}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: index * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function HeroChatMockup() {
  const prefersReducedMotion = useReducedMotion() === true;
  const [started, setStarted] = useState(false);

  const [phase, setPhase] = useState<HeroPhase>('idle');
  const [typedQuestion, setTypedQuestion] = useState('');
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    setStarted(true);
  }, []);

  useEffect(() => {
    if (!started) {
      return;
    }

    if (prefersReducedMotion) {
      setPhase('done');
      setTypedQuestion(USER_QUESTION);
      setVisibleSteps(ASSISTANT_STEPS.length);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      try {
        while (!signal.aborted) {
          setPhase('idle');
          setTypedQuestion('');
          setVisibleSteps(0);
          await sleep(700, signal);

          setPhase('typing');
          for (let index = 1; index <= USER_QUESTION.length; index += 1) {
            setTypedQuestion(USER_QUESTION.slice(0, index));
            await sleep(24, signal);
          }

          await sleep(350, signal);
          setPhase('sent');
          await sleep(500, signal);

          setPhase('thinking');
          await sleep(1200, signal);

          setPhase('answer');
          for (let index = 1; index <= ASSISTANT_STEPS.length; index += 1) {
            setVisibleSteps(index);
            await sleep(400, signal);
          }

          setPhase('done');
          await sleep(4500, signal);
        }
      } catch {
        // Aborted — ignore.
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [started, prefersReducedMotion]);

  const showTypingBubble = phase === 'typing' && typedQuestion.length > 0;
  const showUserBubble =
    phase === 'sent' || phase === 'thinking' || phase === 'answer' || phase === 'done';
  const showThinking = phase === 'thinking';
  const showAnswer = phase === 'answer' || phase === 'done';

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-2 backdrop-blur">
        <span className="rounded-md border border-zinc-700 p-1.5 text-zinc-400">
          <Mic className="h-3.5 w-3.5" />
        </span>
        <span className="rounded-md border border-zinc-700 p-1.5 text-zinc-400">
          <Paperclip className="h-3.5 w-3.5" />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-950 sm:px-4 sm:text-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Ask Aproko
        </span>
        <span className="rounded-md border border-zinc-700 p-1.5 text-zinc-400">
          <Grid3x3 className="h-3.5 w-3.5" />
        </span>
        <span className="rounded-md border border-zinc-700 p-1.5 text-zinc-400">
          <Settings className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" />
            <span className="font-medium text-zinc-200">Chat</span>
          </div>
          <span className="rounded-md border border-zinc-700 px-2 py-0.5">Smart Mode</span>
        </div>

        <div className="min-h-[300px] space-y-3 p-4 text-sm">
          <AnimatePresence mode="popLayout">
            {showTypingBubble ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="ml-auto max-w-[92%]"
                exit={{ opacity: 0, y: 6 }}
                initial={{ opacity: 0, y: 8 }}
                key="typing-bubble"
                layout
                transition={{ duration: 0.25 }}
              >
                <p className="rounded-xl border border-zinc-700/80 bg-zinc-900 px-3 py-2.5 text-left text-zinc-200">
                  {typedQuestion}
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    className="ml-0.5 inline-block h-4 w-0.5 translate-y-px bg-zinc-400"
                    transition={{ duration: 0.75, repeat: Infinity }}
                  />
                </p>
              </motion.div>
            ) : null}

            {showUserBubble ? (
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="ml-auto max-w-[92%] rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-zinc-200"
                exit={{ opacity: 0, y: 6 }}
                initial={{ opacity: 0, y: 10 }}
                key="user-message"
                layout
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {USER_QUESTION}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {showThinking ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
                exit={{ opacity: 0, y: 4 }}
                initial={{ opacity: 0, y: 6 }}
                key="thinking"
              >
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3">
                  <TypingDots />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {showAnswer ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 text-zinc-300"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0, y: 8 }}
                key="answer"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="leading-relaxed">
                  {ASSISTANT_INTRO}{' '}
                  <span className="font-mono text-zinc-100">{ASSISTANT_EQUATION}</span>
                </p>
                <ol className="list-decimal space-y-1.5 pl-5 text-zinc-400">
                  {ASSISTANT_STEPS.slice(0, visibleSteps).map((step) => (
                    <motion.li
                      animate={{ opacity: 1, x: 0 }}
                      initial={{ opacity: 0, x: -8 }}
                      key={step}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      {step}
                    </motion.li>
                  ))}
                </ol>
                {phase === 'done' && visibleSteps === ASSISTANT_STEPS.length ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Badge className="border-zinc-600 bg-zinc-800 text-zinc-200" variant="outline">
                      Context — Your Library
                    </Badge>
                  </motion.div>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {phase === 'idle' ? (
            <p className="pt-6 text-center text-xs text-zinc-600">
              Ask anything from your library…
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t border-zinc-800 px-3 py-2.5">
          <Paperclip className="h-4 w-4 shrink-0 text-zinc-500" />
          <div className="flex-1 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs">
            {phase === 'typing' ? (
              <span className="block truncate text-zinc-400">Sending…</span>
            ) : (
              <span className="text-zinc-500">Type your message...</span>
            )}
          </div>
          <motion.span
            animate={phase === 'typing' ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-950"
            transition={{ duration: 0.3, repeat: phase === 'typing' ? Infinity : 0 }}
          >
            <Send className="h-3.5 w-3.5" />
          </motion.span>
        </div>
      </div>
    </div>
  );
}

function MemoryChatMockup() {
  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-3 flex items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-2 backdrop-blur">
        <span className="rounded-md border border-zinc-700 p-1.5 text-zinc-400">
          <Mic className="h-3.5 w-3.5" />
        </span>
        <span className="rounded-md border border-zinc-700 p-1.5 text-zinc-400">
          <Paperclip className="h-3.5 w-3.5" />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-950">
          <Sparkles className="h-3 w-3" />
          Ask Aproko
        </span>
        <span className="rounded-md border border-zinc-700 p-1.5 text-zinc-400">
          <Grid3x3 className="h-3.5 w-3.5" />
        </span>
        <span className="rounded-md border border-zinc-700 p-1.5 text-zinc-400">
          <Settings className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" />
            <span className="font-medium text-zinc-200">Chat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-zinc-700 px-2 py-0.5">Remember</span>
            <span className="rounded-md border border-zinc-700 px-2 py-0.5">Smart Mode</span>
          </div>
        </div>
        <div className="space-y-3 p-4 text-sm">
          <p className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 leading-relaxed text-zinc-300">
            Got it. I&apos;ve saved the assignment details from your library — the due date,
            formatting requirements, and grading rubric. Ask me about any of this later and
            I&apos;ll pull it up instantly.
          </p>
          <Badge className="border-zinc-600 bg-zinc-800 text-zinc-200" variant="outline">
            ✓ Saved to memory
          </Badge>
        </div>
        <div className="flex items-center gap-2 border-t border-zinc-800 px-3 py-2.5">
          <Paperclip className="h-4 w-4 shrink-0 text-zinc-500" />
          <div className="flex-1 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500">
            Type your message...
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-950">
            <Send className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function ChatMockup({ variant = 'hero' }: ChatMockupProps) {
  if (variant === 'memory') {
    return <MemoryChatMockup />;
  }

  return <HeroChatMockup />;
}
