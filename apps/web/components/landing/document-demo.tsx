'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const LIBRARY_FILES = [
  'OOP Lecture Notes.pdf',
  'Research Paper Draft.docx',
  'Team Meeting Transcript.txt',
];

const USER_QUESTION = 'What is this document about?';

const ASSISTANT_ANSWER =
  'The speaker introduces object-oriented programming — classes as blueprints, objects as instances, and inheritance for reuse. Sources: OOP Lecture Notes.pdf (p. 2–4).';

const QUICK_ACTIONS = ['What did they say?', 'Summarize', 'Create flashcards'];

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
    <div aria-hidden="true" className="flex items-center gap-1 px-1 py-1.5">
      {[0, 1, 2].map((index) => (
        <motion.span
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
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

type DemoPhase = 'idle' | 'files' | 'typing' | 'sent' | 'thinking' | 'answer' | 'actions' | 'done';

export function DocumentDemo() {
  const prefersReducedMotion = useReducedMotion() === true;
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [visibleFiles, setVisibleFiles] = useState(0);
  const [typedQuestion, setTypedQuestion] = useState('');
  const [visibleAnswerChars, setVisibleAnswerChars] = useState(0);
  const [visibleActions, setVisibleActions] = useState(0);

  useEffect(() => {
    setStarted(true);
  }, []);

  useEffect(() => {
    if (!started) {
      return;
    }

    if (prefersReducedMotion) {
      setPhase('done');
      setVisibleFiles(LIBRARY_FILES.length);
      setTypedQuestion(USER_QUESTION);
      setVisibleAnswerChars(ASSISTANT_ANSWER.length);
      setVisibleActions(QUICK_ACTIONS.length);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      try {
        while (!signal.aborted) {
          setPhase('idle');
          setVisibleFiles(0);
          setTypedQuestion('');
          setVisibleAnswerChars(0);
          setVisibleActions(0);
          await sleep(600, signal);

          setPhase('files');
          for (let index = 1; index <= LIBRARY_FILES.length; index += 1) {
            setVisibleFiles(index);
            await sleep(350, signal);
          }

          await sleep(400, signal);
          setPhase('typing');
          for (let index = 1; index <= USER_QUESTION.length; index += 1) {
            setTypedQuestion(USER_QUESTION.slice(0, index));
            await sleep(26, signal);
          }

          await sleep(300, signal);
          setPhase('sent');
          await sleep(450, signal);

          setPhase('thinking');
          await sleep(900, signal);

          setPhase('answer');
          for (let index = 1; index <= ASSISTANT_ANSWER.length; index += 6) {
            setVisibleAnswerChars(Math.min(index, ASSISTANT_ANSWER.length));
            await sleep(16, signal);
          }
          setVisibleAnswerChars(ASSISTANT_ANSWER.length);

          setPhase('actions');
          for (let index = 1; index <= QUICK_ACTIONS.length; index += 1) {
            setVisibleActions(index);
            await sleep(200, signal);
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
  }, [prefersReducedMotion, started]);

  const showQuestion =
    phase === 'typing' ||
    phase === 'sent' ||
    phase === 'thinking' ||
    phase === 'answer' ||
    phase === 'actions' ||
    phase === 'done';
  const showThinking = phase === 'thinking';
  const showAnswer = phase === 'answer' || phase === 'actions' || phase === 'done';

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80 sm:rounded-2xl">
      <div className="border-b border-zinc-800 px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="text-sm font-medium text-zinc-100">Document intelligence</p>
        <p className="text-xs leading-relaxed text-zinc-400">
          Upload PDFs, slides, and transcripts — Aproko parses, indexes, and cites them in chat.
        </p>
      </div>
      <div className="grid gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Library</p>
          <div className="mt-3 space-y-2 text-xs sm:text-sm">
            {LIBRARY_FILES.slice(0, visibleFiles).map((file, index) => (
              <motion.p
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300"
                initial={{ opacity: 0, x: -8 }}
                key={file}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <span className="truncate">{file}</span>
                <span className="shrink-0 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                  Indexed
                </span>
              </motion.p>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Aproko Chat</p>
          <div className="mt-3 min-h-[160px] space-y-2 text-xs sm:text-sm">
            <AnimatePresence mode="popLayout">
              {showQuestion ? (
                <motion.p
                  animate={{ opacity: 1, y: 0 }}
                  className="ml-auto max-w-[90%] rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-300"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0, y: 6 }}
                  key="doc-question"
                >
                  {phase === 'typing' ? typedQuestion : USER_QUESTION}
                  {phase === 'typing' ? (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-px bg-zinc-400"
                      transition={{ duration: 0.75, repeat: Infinity }}
                    />
                  ) : null}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {showThinking ? (
                <motion.div
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  key="doc-thinking"
                >
                  <TypingDots />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {showAnswer ? (
                <motion.p
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 leading-relaxed text-zinc-400"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0, y: 6 }}
                  key="doc-answer"
                >
                  {ASSISTANT_ANSWER.slice(0, visibleAnswerChars)}
                  {phase === 'answer' && visibleAnswerChars < ASSISTANT_ANSWER.length ? (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-px bg-zinc-500"
                      transition={{ duration: 0.75, repeat: Infinity }}
                    />
                  ) : null}
                </motion.p>
              ) : null}
            </AnimatePresence>

            {(phase === 'actions' || phase === 'done') && visibleActions > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_ACTIONS.slice(0, visibleActions).map((action) => (
                  <motion.span
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 sm:text-xs"
                    initial={{ opacity: 0, scale: 0.95 }}
                    key={action}
                    transition={{ duration: 0.25 }}
                  >
                    {action}
                  </motion.span>
                ))}
              </div>
            ) : null}

            {phase === 'idle' || phase === 'files' ? (
              <p className="pt-6 text-center text-[11px] text-zinc-600">Upload sources to start…</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
