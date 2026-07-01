import Link from 'next/link';
import { AppPageShell } from '@/components/app/app-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getWorkspaceDashboardStats,
  type DashboardActivityStatus,
} from '@/lib/storage/dashboard-stats';
import { syncProfileFromClerkUser } from '@/lib/auth/profile-sync';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ArrowUpRight, FileText, MessageSquare, Sparkles } from 'lucide-react';

const statusVariant: Record<DashboardActivityStatus, 'default' | 'secondary' | 'outline'> = {
  Indexed: 'default',
  Synced: 'secondary',
  Ranked: 'outline',
  Active: 'default',
};

export default async function DashboardPage() {
  const { userId } = await auth();
  let user = null;

  try {
    user = await currentUser();
  } catch (error) {
    console.error('Dashboard user lookup failed', error);
  }

  let profileSynced = false;

  if (userId && user) {
    try {
      await syncProfileFromClerkUser(user);
      profileSynced = true;
    } catch (error) {
      console.error('Dashboard profile sync failed', error);
    }
  }

  let stats;
  try {
    stats = await getWorkspaceDashboardStats('default-workspace', userId);
  } catch (error) {
    console.error('Dashboard stats load failed', error);
    stats = {
      sourceCount: 0,
      sourcesThisWeek: 0,
      memoryCount: 0,
      studyItemCount: 0,
      chatSessionCount: 0,
      studyStreakDays: 0,
      recentActivity: [],
    };
  }

  const metrics = [
    {
      label: 'Active Sources',
      value: String(stats.sourceCount),
      helper:
        stats.sourcesThisWeek > 0
          ? `+${stats.sourcesThisWeek} this week`
          : 'Upload documents to get started',
    },
    {
      label: 'Memory Captures',
      value: String(stats.memoryCount),
      helper: stats.memoryCount > 0 ? 'Indexed and searchable' : 'No memory items yet',
    },
    {
      label: 'Study Streak',
      value: stats.studyStreakDays > 0 ? `${stats.studyStreakDays} days` : '0 days',
      helper:
        stats.studyItemCount > 0
          ? `${stats.studyItemCount} study outputs in workspace`
          : 'Create notes or quizzes to build momentum',
    },
    {
      label: 'AI Sessions',
      value: String(stats.chatSessionCount),
      helper:
        stats.chatSessionCount > 0 ? 'Workspace conversations' : 'Start your first chat session',
    },
  ];

  return (
    <AppPageShell pageId="dashboard">
      <section className="space-y-6">
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Your workspace is connected and ready. Start from your knowledge base, then move into
              chat, memory, and study workflows without context switching.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full transition-transform hover:-translate-y-0.5">
              <Link href="/library">
                Open Library
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full transition-transform hover:-translate-y-0.5"
              variant="secondary"
            >
              <Link href="/chat">
                Continue Chat
                <MessageSquare className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full transition-transform hover:-translate-y-0.5"
              variant="outline"
            >
              <Link href="/research">
                Open Research
                <Sparkles className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card
              className="border-zinc-200 bg-white transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
              key={metric.label}
            >
              <CardHeader className="pb-2">
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  {metric.label}
                </CardDescription>
                <CardTitle className="text-3xl tracking-tight text-zinc-900 dark:text-zinc-100">
                  {metric.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{metric.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="activity">
          <TabsList>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="workspace-health">Workspace Health</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates across your workspace.</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentActivity.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      No activity yet
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Upload a document or start a chat to see updates here.
                    </p>
                  </div>
                ) : (
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
                      {stats.recentActivity.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="max-w-[240px] truncate font-medium">
                            {row.item}
                          </TableCell>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workspace-health">
            <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
              <CardHeader>
                <CardTitle>Workspace Health</CardTitle>
                <CardDescription>
                  Integration readiness and profile synchronization status.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="flex items-center gap-2">
                  <Badge variant={profileSynced ? 'default' : 'secondary'}>
                    {profileSynced ? 'Synced' : 'Pending'}
                  </Badge>
                  <span>Profile sync with Supabase</span>
                </p>
                <p className="flex items-center gap-2">
                  <Badge variant="outline">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{userId ?? 'unknown'}</span>
                  </Badge>
                  <span className="text-zinc-600 dark:text-zinc-400">Clerk user identifier</span>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </AppPageShell>
  );
}
