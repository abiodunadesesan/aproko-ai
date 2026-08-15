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
  {
    label: 'Library',
    description: 'Upload and index sources',
    href: '/library',
    icon: BookOpen,
  },
  {
    label: 'Chat',
    description: 'Ask with citations',
    href: '/chat',
    icon: MessageSquare,
  },
  {
    label: 'Study',
    description: 'Flashcards and quizzes',
    href: '/study',
    icon: GraduationCap,
  },
  {
    label: 'Writing',
    description: 'Polish for clarity',
    href: '/writing',
    icon: PenLine,
  },
  {
    label: 'Search',
    description: 'Find across knowledge',
    href: '/search',
    icon: Search,
  },
  {
    label: 'Research',
    description: 'Explore with AI',
    href: '/research',
    icon: Sparkles,
  },
];

function ActivityEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No activity yet</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Upload a document or start a chat to see updates here.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
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
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 lg:hidden">
      {items.map((row) => (
        <li className="flex items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0" key={row.id}>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{row.item}</p>
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
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="max-w-[280px] truncate font-medium">{row.item}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
              </TableCell>
              <TableCell className="text-right text-zinc-600 dark:text-zinc-400">
                {row.updatedLabel}
              </TableCell>
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
    <AppPageFrame className="sm:space-y-8">
      <AppReveal>
        <header className="space-y-4 sm:space-y-5">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-amber-700/80 dark:text-amber-400/80">
              Workspace overview
            </p>
            <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              {greeting}
            </h2>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
              Start from your knowledge base, then move into chat, memory, and study without losing
              context.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button asChild className="h-11 w-full rounded-full sm:w-auto">
              <Link href="/library">
                Open Library
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="h-11 w-full rounded-full sm:w-auto" variant="secondary">
              <Link href="/chat">
                Continue Chat
                <MessageSquare className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="h-11 w-full rounded-full sm:w-auto" variant="outline">
              <Link href="/study">
                Study tools
                <GraduationCap className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>
      </AppReveal>

      <AppStagger className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <AppStaggerItem key={metric.label}>
              <Link
                className={cn(
                  'group block rounded-2xl border border-zinc-200/90 bg-white/90 p-3.5 shadow-sm backdrop-blur-sm transition-[border-color,transform,box-shadow] duration-200',
                  'hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
                  'dark:border-zinc-800 dark:bg-zinc-900/55 dark:hover:border-zinc-700 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-950',
                  'sm:p-5',
                )}
                href={metric.href}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 sm:text-xs">
                    {metric.label}
                  </p>
                  <span className="rounded-lg bg-zinc-100 p-1.5 text-zinc-600 transition-colors group-hover:bg-amber-50 group-hover:text-amber-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-amber-950/50 dark:group-hover:text-amber-300">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:mt-3 sm:text-3xl">
                  {metric.value}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 sm:mt-2 sm:text-xs">
                  {metric.helper}
                </p>
              </Link>
            </AppStaggerItem>
          );
        })}
      </AppStagger>

      <AppReveal delay={0.08}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.9fr)] lg:gap-6">
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
            <AppPanelBody className="grid grid-cols-2 gap-2 pt-0 sm:gap-3 sm:pt-0">
              {shortcuts.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    className={cn(
                      'flex min-h-[4.5rem] flex-col rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 transition-colors',
                      'hover:border-zinc-300 hover:bg-white',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
                      'dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900',
                      'dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-950',
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                    <span className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
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
                  'flex items-center justify-between gap-3 px-3 py-2.5',
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
                  'flex items-center justify-between gap-3 px-3 py-2.5',
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
    </AppPageFrame>
  );
}
