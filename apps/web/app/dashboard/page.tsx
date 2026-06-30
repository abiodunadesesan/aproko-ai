import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { ArrowUpRight, FileText, MessageSquare, Sparkles } from 'lucide-react';
import { syncProfileFromClerkUser } from '@/lib/auth/profile-sync';
import { AppShell } from '@/components/app-shell';
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

const metrics = [
  { label: 'Active Sources', value: '24', helper: '+6 this week' },
  { label: 'Memory Captures', value: '183', helper: 'Indexed and searchable' },
  { label: 'Study Streak', value: '7 days', helper: 'Consistent momentum' },
  { label: 'AI Sessions', value: '41', helper: 'Workspace conversations' },
];

type ActivityStatus = 'Indexed' | 'Synced' | 'Ranked';

const recentActivity: Array<{
  item: string;
  type: string;
  status: ActivityStatus;
  updated: string;
}> = [
  { item: 'Q2 Marketing Deck', type: 'Source', status: 'Indexed', updated: '2h ago' },
  { item: 'Growth Strategy Notes', type: 'Note', status: 'Synced', updated: '5h ago' },
  { item: 'Customer Interview Batch', type: 'Memory', status: 'Ranked', updated: 'Yesterday' },
];

const statusVariant: Record<ActivityStatus, 'default' | 'secondary' | 'outline'> = {
  Indexed: 'default',
  Synced: 'secondary',
  Ranked: 'outline',
};

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  let profileSynced = false;

  if (userId && user) {
    try {
      await syncProfileFromClerkUser(user);
      profileSynced = true;
    } catch (error) {
      console.error('Dashboard profile sync failed', error);
    }
  }

  return (
    <AppShell
      subtitle="A premium, knowledge-first workspace: capture context quickly, keep momentum, and jump back in with AI."
      title="Dashboard"
    >
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Your workspace is connected and ready. Start from your knowledge base, then move into
              chat, memory, and study workflows without context switching.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/library">
                Open Library
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/chat">
                Continue Chat
                <MessageSquare className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/research">
                Open Research
                <Sparkles className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <CardHeader className="pb-2">
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-2xl">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{metric.helper}</p>
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
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates across your workspace.</CardDescription>
              </CardHeader>
              <CardContent>
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
                    {recentActivity.map((row) => (
                      <TableRow key={row.item}>
                        <TableCell className="font-medium">{row.item}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {row.updated}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workspace-health">
            <Card>
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
                  <span className="text-muted-foreground">Clerk user identifier</span>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </AppShell>
  );
}
