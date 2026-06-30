'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  Brain,
  FlaskConical,
  LayoutDashboard,
  MessageSquare,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Chat', icon: MessageSquare, active: false },
  { label: 'Library', icon: BookOpen, active: false },
  { label: 'Memory', icon: Brain, active: false },
  { label: 'Research', icon: FlaskConical, active: false },
];

const metrics = [
  { label: 'Active Sources', value: '24', helper: '+6 this week' },
  { label: 'Memory Captures', value: '183', helper: 'Indexed' },
  { label: 'Study Streak', value: '7 days', helper: 'Momentum' },
  { label: 'AI Sessions', value: '41', helper: 'This month' },
];

const activity = [
  { item: 'Q2 Marketing Deck', type: 'Source', status: 'Indexed', updated: '2h ago' },
  { item: 'Growth Strategy Notes', type: 'Note', status: 'Synced', updated: '5h ago' },
  { item: 'Customer Interview Batch', type: 'Memory', status: 'Ranked', updated: 'Yesterday' },
];

export function DashboardPreview() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mx-auto w-full max-w-5xl"
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
          <span className="ml-2 text-xs text-zinc-500">app.aproko.ai/dashboard</span>
        </div>

        <div className="flex min-h-[340px] flex-col sm:min-h-[400px] sm:flex-row">
          <aside className="hidden w-44 shrink-0 border-r border-zinc-800 bg-zinc-900/40 p-3 sm:block">
            <p className="px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Workspace
            </p>
            <nav className="mt-2 space-y-0.5">
              {navItems.map((item) => (
                <div
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                    item.active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'
                  }`}
                  key={item.label}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  {item.label}
                </div>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <p className="text-sm font-semibold text-zinc-100">Dashboard</p>
                <p className="text-[11px] text-zinc-500">Knowledge-first workspace overview</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400">
                <Search className="h-3 w-3" />
                ⌘K
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="text-xs font-medium text-zinc-100">Welcome back</p>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                Your workspace is ready. Jump into library, chat, or study without context
                switching.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['Open Library', 'Continue Chat', 'Open Research'].map((action) => (
                  <span
                    className="rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-300"
                    key={action}
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {metrics.map((metric, idx) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5"
                  initial={{ opacity: 0, y: 12 }}
                  key={metric.label}
                  transition={{ duration: 0.4, delay: 0.3 + idx * 0.07 }}
                >
                  <p className="text-[10px] text-zinc-500">{metric.label}</p>
                  <p className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-100">
                    {metric.value}
                  </p>
                  <p className="text-[10px] text-zinc-600">{metric.helper}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800">
              <div className="border-b border-zinc-800 bg-zinc-900/60 px-3 py-2">
                <p className="text-[11px] font-medium text-zinc-200">Recent Activity</p>
              </div>
              <div className="divide-y divide-zinc-800/80">
                {activity.map((row, idx) => (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2 text-[10px] sm:grid-cols-[1.2fr_0.6fr_0.6fr_0.5fr]"
                    initial={{ opacity: 0, x: -8 }}
                    key={row.item}
                    transition={{ duration: 0.35, delay: 0.55 + idx * 0.06 }}
                  >
                    <span className="truncate font-medium text-zinc-300">{row.item}</span>
                    <span className="hidden text-zinc-500 sm:inline">{row.type}</span>
                    <Badge
                      className="hidden w-fit border-zinc-700 bg-zinc-800 text-[9px] text-zinc-300 sm:inline-flex"
                      variant="outline"
                    >
                      {row.status}
                    </Badge>
                    <span className="text-right text-zinc-600">{row.updated}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
