import { Grid3x3, Mic, Paperclip, Plus, Send, Settings, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ChatMockupProps = {
  variant?: 'hero' | 'memory';
};

export function ChatMockup({ variant = 'hero' }: ChatMockupProps) {
  if (variant === 'memory') {
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
        <div className="space-y-3 p-4 text-sm">
          <p className="ml-auto max-w-[85%] rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-zinc-200">
            Can you explain how to solve the differential equation in my uploaded notes?
          </p>
          <div className="space-y-2 text-zinc-300">
            <p className="leading-relaxed">
              This is a first-order linear ODE:{' '}
              <span className="font-mono text-zinc-100">y&apos; + 2y = eˣ</span>
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-zinc-400">
              <li>Find the integrating factor μ(x) = e^(∫2 dx) = e^(2x)</li>
              <li>Multiply both sides by μ(x)</li>
              <li>Integrate and solve for y</li>
              <li>Apply initial conditions if provided</li>
            </ol>
            <Badge className="border-zinc-600 bg-zinc-800 text-zinc-200" variant="outline">
              Context — Your Library
            </Badge>
          </div>
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
