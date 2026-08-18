'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  FileText,
  Flame,
  GraduationCap,
  MessageSquare,
  PenLine,
  Search,
  Sparkles,
} from 'lucide-react';
import { AppReveal, AppStagger, AppStaggerItem } from '@/components/app/app-motion';
import { DashboardWorkspace } from '@/components/dashboard-workspace';
import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
  appSurface,
} from '@/components/app/app-surface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type {
  DashboardActivityItem,
  DashboardActivityStatus,
  DashboardStats,
} from '@/lib/storage/dashboard-stats';

const statusVariant: Record<DashboardActivityStatus, 'default' | 'secondary' | 'outline'> = {
  Indexed: 'default',
  Synced: 'secondary',
  Ranked: 'outline',
  Active: 'default',
};

type Metric = {
  label: string;
  value: string;
  helper: string;
  href: string;
  icon: LucideIcon;
};

type Shortcut = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type DashboardHomeProps = {
  displayName: string | null;
  profileSynced: boolean;
  userId: string | null;
  stats: DashboardStats;
};

function buildMetrics(stats: DashboardStats): Metric[] {
  return [
    {
      label: 'Active sources',
      value: String(stats.sourceCount),
      helper:
        stats.sourcesThisWeek > 0
          ? `+${stats.sourcesThisWeek} this week`
          : 'Upload documents to get started',
      href: '/library',
      icon: FileText,
    },
    {
      label: 'Memory captures',
      value: String(stats.memoryCount),
      helper: stats.memoryCount > 0 ? 'Indexed and searchable' : 'No memory items yet',
      href: '/memory',
      icon: Brain,
    },
    {
      label: 'Study streak',
      value: stats.studyStreakDays > 0 ? `${stats.studyStreakDays}d` : '0d',
      helper:
        stats.studyItemCount > 0
          ? `${stats.studyItemCount} study outputs in workspace`
          : 'Create notes or quizzes to build momentum',
      href: '/study',
      icon: Flame,
    },
    {
      label: 'AI sessions',
      value: String(stats.chatSessionCount),
      helper:
        stats.chatSessionCount > 0 ? 'Workspace conversations' : 'Start your first chat session',
      href: '/chat',
      icon: MessageSquare,
    },
  ];
}

const shortcuts: Shortcut[] = [
  { label: 'Library', description: 'Upload and index sources', href: '/library', icon: BookOpen },
  { label: 'Chat', description: 'Ask with citations', href: '/chat', icon: MessageSquare },
  { label: 'Study', description: 'Flashcards and quizzes', href: '/study', icon: GraduationCap },
  { label: 'Writing', description: 'Polish for clarity', href: '/writing', icon: PenLine },
  { label: 'Search', description: 'Find across knowledge', href: '/search', icon: Search },
  { label: 'Research', description: 'Explore with AI', href: '/research', icon: Sparkles },
];

function ActivityEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-black/[0.08] bg-gradient-to-b from-white/60 to-transparent px-4 py-12 text-center dark:border-white/10 dark:from-white/[0.03]">
      <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        No activity yet
      </p>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        Upload a document or start a chat to see updates here.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button asChild className="rounded-full" size="sm">
          <Link href="/library">Open Library</Link>
        </Button>
        <Button asChild className="rounded-full" size="sm" variant="outline">
          <Link href="/chat">Start chat</Link>
        </Button>
      </div>
    </div>
  );
}

function ActivityMobileList({ items }: { items: DashboardActivityItem[] }) {
  return (
    <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.06] lg:hidden">
      {items.map((row) => (
        <li
          className="flex items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
          key={row.id}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {row.item}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {row.type}
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">·</span>
              {row.updatedLabel}
            </p>
          </div>
          <Badge className="shrink-0" variant={statusVariant[row.status]}>
            {row.status}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function ActivityDesktopTable({ items }: { items: DashboardActivityItem[] }) {
  return (
    <div className="hidden lg:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
              Item
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
              Type
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
              Status
            </TableHead>
            <TableHead className="text-right text-[11px] uppercase tracking-[0.12em] text-zinc-500">
              Updated
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="max-w-[280px] truncate font-medium">{row.item}</TableCell>
              <TableCell className="text-zinc-500">{row.type}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
              </TableCell>
              <TableCell className="text-right text-zinc-500">{row.updatedLabel}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DashboardHome({
  displayName,
  profileSynced,
  userId,
  stats,
}: DashboardHomeProps) {
  const metrics = buildMetrics(stats);
  const greeting = displayName ? `Welcome back, ${displayName}` : 'Welcome back';

  return (
    <AppPageFrame className="sm:space-y-8" withAtmosphere={false}>
      <AppReveal>
        <header className="relative overflow-hidden rounded-[1.35rem] border border-black/[0.06] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-6 text-white shadow-premium dark:border-white/10 dark:from-zinc-100 dark:via-white dark:to-zinc-200 dark:text-zinc-950 dark:shadow-premium-dark sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-amber-400/25 blur-3xl dark:bg-amber-500/30"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-300/90 dark:text-amber-700">
              Workspace overview
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              {greeting}
            </h2>
            <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-zinc-300 dark:text-zinc-600 sm:text-[15px]">
              Your knowledge OS is ready — jump into library, chat, or study without losing context.
            </p>
          </div>
          <div className="relative mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Button
              asChild
              className="h-11 w-full rounded-full bg-white text-zinc-950 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800 sm:w-auto"
            >
              <Link href="/library">
                Open Library
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="h-11 w-full rounded-full border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15 dark:border-zinc-900/15 dark:bg-zinc-950/5 dark:text-zinc-900 dark:hover:bg-zinc-950/10 sm:w-auto"
              variant="outline"
            >
              <Link href="/chat">
                Continue Chat
                <MessageSquare className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="h-11 w-full rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 dark:border-zinc-900/15 dark:text-zinc-900 dark:hover:bg-zinc-950/5 sm:w-auto"
              variant="ghost"
            >
              <Link href="/study">
                Study tools
                <GraduationCap className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>
      </AppReveal>

      <DashboardWorkspace
        chatSessionCount={stats.chatSessionCount}
        studyItemCount={stats.studyItemCount}
        overview={
          <>
            <AppStagger className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <AppStaggerItem key={metric.label}>
                    <Link
                      className={cn(
                        'group relative block overflow-hidden rounded-2xl border border-black/[0.06] bg-white/75 p-4 shadow-premium backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-200',
                        'hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-lg',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30',
                        'dark:border-white/[0.07] dark:bg-white/[0.035] dark:shadow-premium-dark dark:hover:border-amber-400/30',
                        'sm:p-5',
                      )}
                      href={metric.href}
                    >
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-amber-400/0 blur-2xl transition-colors duration-300 group-hover:bg-amber-400/20"
                      />
                      <div className="relative flex items-start justify-between gap-2">
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                          {metric.label}
                        </p>
                        <span className="rounded-xl bg-zinc-900/5 p-2 text-zinc-700 transition-colors group-hover:bg-amber-500/15 group-hover:text-amber-800 dark:bg-white/5 dark:text-zinc-300 dark:group-hover:bg-amber-400/15 dark:group-hover:text-amber-200">
                          <Icon className="h-4 w-4" />
                        </span>
                      </div>
                      <p className="relative mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                        {metric.value}
                      </p>
                      <p className="relative mt-2 line-clamp-2 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                        {metric.helper}
                      </p>
                    </Link>
                  </AppStaggerItem>
                );
              })}
            </AppStagger>

            <AppReveal delay={0.06}>
              <div className="mt-6 grid gap-4 sm:mt-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.9fr)] lg:gap-6">
                <AppPanel>
                  <AppPanelHeader
                    action={
                      stats.recentActivity.length > 0 ? (
                        <Button
                          asChild
                          className="hidden shrink-0 rounded-full sm:inline-flex"
                          size="sm"
                          variant="ghost"
                        >
                          <Link href="/library">
                            View library
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      ) : null
                    }
                    description="Latest updates across your workspace."
                    title="Recent activity"
                  />
                  <AppPanelBody className="pt-0 sm:pt-0">
                    {stats.recentActivity.length === 0 ? (
                      <ActivityEmptyState />
                    ) : (
                      <>
                        <ActivityMobileList items={stats.recentActivity} />
                        <ActivityDesktopTable items={stats.recentActivity} />
                      </>
                    )}
                  </AppPanelBody>
                </AppPanel>

                <div className="flex flex-col gap-4">
                  <AppPanel>
                    <AppPanelHeader
                      description="Shortcuts to the tools you use most."
                      title="Jump back in"
                    />
                    <AppPanelBody className="grid grid-cols-2 gap-2.5 pt-0 sm:gap-3 sm:pt-0">
                      {shortcuts.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            className={cn(
                              'flex min-h-[5rem] flex-col rounded-xl border border-black/[0.05] bg-black/[0.02] p-3.5 transition-[background-color,border-color,transform] duration-200',
                              'hover:-translate-y-0.5 hover:border-amber-500/25 hover:bg-white',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/25',
                              'dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-amber-400/25 dark:hover:bg-white/[0.05]',
                            )}
                            href={item.href}
                            key={item.href}
                          >
                            <Icon className="h-4 w-4 text-amber-700/80 dark:text-amber-300/90" />
                            <span className="mt-2.5 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                              {item.label}
                            </span>
                            <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                              {item.description}
                            </span>
                          </Link>
                        );
                      })}
                    </AppPanelBody>
                  </AppPanel>

                  <AppPanel>
                    <AppPanelHeader
                      description="Account sync and connection status."
                      title="Workspace health"
                    />
                    <AppPanelBody className="space-y-3 pt-0 sm:pt-0">
                      <div
                        className={cn(
                          appSurface.inset,
                          'flex items-center justify-between gap-3 px-3.5 py-3',
                        )}
                      >
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Profile sync</span>
                        <Badge variant={profileSynced ? 'default' : 'secondary'}>
                          {profileSynced ? 'Synced' : 'Pending'}
                        </Badge>
                      </div>
                      <div
                        className={cn(
                          appSurface.inset,
                          'flex items-center justify-between gap-3 px-3.5 py-3',
                        )}
                      >
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Signed-in user</span>
                        <Badge className="max-w-[9rem] truncate font-mono text-[10px]" variant="outline">
                          {userId ?? 'unknown'}
                        </Badge>
                      </div>
                      <Button asChild className="mt-1 w-full rounded-full" size="sm" variant="outline">
                        <Link href="/settings">Open settings</Link>
                      </Button>
                    </AppPanelBody>
                  </AppPanel>
                </div>
              </div>
            </AppReveal>
          </>
        }
      />
    </AppPageFrame>
  );
}
