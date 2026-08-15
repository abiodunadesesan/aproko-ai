'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { FileText, Sparkles } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
  appSurface,
} from '@/components/app/app-surface';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type ResearchWorkspace = {
  id: string;
  title: string;
  description: string | null;
  updatedAt: string;
};

type ResearchWorkspaceSource = {
  sourceId: string;
  addedAt: string;
};

type Source = {
  id: string;
  name: string;
  project: string;
  folder: string;
};

export default function ResearchPage() {
  const { workspaceId, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace();
  const [researchWorkspaces, setResearchWorkspaces] = useState<ResearchWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('');
  const [linkedSources, setLinkedSources] = useState<ResearchWorkspaceSource[]>([]);
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [titleDraft, setTitleDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [sourceToLink, setSourceToLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeWorkspace = useMemo(
    () => researchWorkspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
    [activeWorkspaceId, researchWorkspaces],
  );

  const linkedSourceIds = useMemo(
    () => new Set(linkedSources.map((item) => item.sourceId)),
    [linkedSources],
  );

  const availableSources = useMemo(
    () => allSources.filter((source) => !linkedSourceIds.has(source.id)),
    [allSources, linkedSourceIds],
  );

  const linkedSourceDetails = useMemo(
    () =>
      linkedSources.map((item) => ({
        ...item,
        source: allSources.find((source) => source.id === item.sourceId) ?? null,
      })),
    [allSources, linkedSources],
  );

  async function loadResearchWorkspaces() {
    const res = await fetch(`/api/v1/workspaces/${workspaceId}/research/workspaces`, {
      cache: 'no-store',
    });
    const payload = await res.json();

    if (!res.ok) {
      throw new Error(payload.error || 'Failed to load research workspaces');
    }

    const data = (payload.data ?? []) as ResearchWorkspace[];
    setResearchWorkspaces(data);
    setActiveWorkspaceId((current) => {
      if (current && data.some((workspace) => workspace.id === current)) {
        return current;
      }
      return data[0]?.id ?? '';
    });
  }

  async function loadLibrarySources() {
    const res = await fetch(`/api/v1/workspaces/${workspaceId}/sources`, { cache: 'no-store' });
    const payload = await res.json();

    if (!res.ok) {
      throw new Error(payload.error || 'Failed to load sources');
    }

    setAllSources((payload.data ?? []) as Source[]);
  }

  async function loadLinkedSources(workspaceId: string) {
    if (!workspaceId) {
      setLinkedSources([]);
      return;
    }

    const res = await fetch(
      `/api/v1/workspaces/${workspaceId}/research/workspaces/${workspaceId}/sources`,
      {
        cache: 'no-store',
      },
    );
    const payload = await res.json();

    if (!res.ok) {
      throw new Error(payload.error || 'Failed to load linked sources');
    }

    setLinkedSources((payload.data ?? []) as ResearchWorkspaceSource[]);
  }

  async function refreshAll() {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([loadResearchWorkspaces(), loadLibrarySources()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load research workspace');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  useEffect(() => {
    void loadLinkedSources(activeWorkspaceId).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to load linked sources');
    });
  }, [activeWorkspaceId]);

  async function handleCreateWorkspace() {
    if (!titleDraft.trim()) {
      setError('Workspace title is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/research/workspaces`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: titleDraft.trim(),
          description: descriptionDraft.trim() || null,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to create workspace');
      }

      const created = payload.data as ResearchWorkspace;
      setResearchWorkspaces((current) => [created, ...current]);
      setActiveWorkspaceId(created.id);
      setTitleDraft('');
      setDescriptionDraft('');
      setNotice(`Research workspace "${created.title}" created.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLinkSource() {
    if (!activeWorkspaceId || !sourceToLink) {
      setError('Select both workspace and source.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceId}/research/workspaces/${activeWorkspaceId}/sources`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sourceId: sourceToLink }),
        },
      );
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to link source');
      }

      setLinkedSources((current) => [payload.data as ResearchWorkspaceSource, ...current]);
      setSourceToLink('');
      setNotice('Source linked to research workspace.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link source');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUnlinkSource(sourceId: string) {
    if (!activeWorkspaceId) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const encoded = encodeURIComponent(sourceId);
      const res = await fetch(
        `/api/v1/workspaces/${workspaceId}/research/workspaces/${activeWorkspaceId}/sources/${encoded}`,
        {
          method: 'DELETE',
        },
      );
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to unlink source');
      }

      setLinkedSources((current) => current.filter((item) => item.sourceId !== sourceId));
      setNotice('Source removed from research workspace.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink source');
    } finally {
      setIsSaving(false);
    }
  }

  if (isWorkspaceLoading || !workspaceId) {
    return (
      <AppPageShell pageId="research">
        <p className="text-sm text-muted-foreground" role="status">
          {workspaceError ?? 'Resolving workspace…'}
        </p>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell pageId="research">
      <AppPageFrame>
        <AppPanel>
          <AppPanelHeader
            description="Define a focused research context for selected sources."
            title="Create Research Workspace"
          />
          <AppPanelBody>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_2fr_auto] lg:items-start">
              <Input
                className={appSurface.field}
                onChange={(event) => setTitleDraft(event.target.value)}
                placeholder="Workspace title"
                value={titleDraft}
              />
              <Textarea
                className={cn(appSurface.field, 'min-h-10 py-2')}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                placeholder="Description (optional)"
                value={descriptionDraft}
              />
              <Button
                className="h-10 w-full rounded-full lg:w-auto"
                disabled={isSaving || !titleDraft.trim()}
                onClick={() => void handleCreateWorkspace()}
                type="button"
              >
                {isSaving ? 'Saving...' : 'Create'}
              </Button>
            </div>
          </AppPanelBody>
        </AppPanel>

        <AppPanel>
          <AppPanelHeader title="Workspace Context" />
          <AppPanelBody>
            {!isLoading && researchWorkspaces.length === 0 ? (
              <EmptyState
                compact
                description="Create a research workspace above to group sources and scope chat context for a specific topic."
                icon={Sparkles}
                title="No research workspaces yet"
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-[minmax(0,280px)_1fr]">
                <Select
                  onValueChange={(value) => setActiveWorkspaceId(value)}
                  value={activeWorkspaceId}
                >
                  <SelectTrigger className="h-10 rounded-xl border-zinc-200 dark:border-zinc-700">
                    <SelectValue
                      placeholder={
                        researchWorkspaces.length ? 'Select workspace' : 'No research workspace yet'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {researchWorkspaces.map((workspace) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        {workspace.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className={cn(appSurface.inset, 'p-3.5 text-sm text-zinc-600 dark:text-zinc-400')}>
                  {activeWorkspace
                    ? `${activeWorkspace.title} • ${activeWorkspace.description ?? 'No description'}`
                    : 'Choose a workspace to manage linked sources.'}
                </div>
              </div>
            )}
          </AppPanelBody>
        </AppPanel>

        <AppPanel>
          <AppPanelHeader title="Linked Sources" />
          <AppPanelBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <Select
                disabled={!activeWorkspaceId || !availableSources.length}
                onValueChange={(value) => setSourceToLink(value)}
                value={sourceToLink}
              >
                <SelectTrigger className="h-10 rounded-xl border-zinc-200 dark:border-zinc-700">
                  <SelectValue
                    placeholder={
                      availableSources.length ? 'Select source to link' : 'No available source'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} ({source.project}/{source.folder})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full rounded-full sm:w-auto"
                disabled={!activeWorkspaceId || !sourceToLink || isSaving}
                onClick={() => void handleLinkSource()}
                type="button"
                variant="outline"
              >
                Link source
              </Button>
            </div>

            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading linked sources...</p>
              ) : !activeWorkspaceId ? (
                <EmptyState
                  compact
                  description="Select or create a research workspace to link library sources."
                  icon={FileText}
                  title="No workspace selected"
                />
              ) : linkedSourceDetails.length === 0 ? (
                <EmptyState
                  compact
                  action={
                    availableSources.length > 0 ? null : (
                      <Button asChild className="rounded-full" size="sm" type="button" variant="outline">
                        <Link href="/library">Upload sources</Link>
                      </Button>
                    )
                  }
                  description="Link documents from your library to scope research context for this workspace."
                  icon={FileText}
                  title="No linked sources yet"
                />
              ) : (
                linkedSourceDetails.map((entry) => (
                  <div
                    className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950/40"
                    key={entry.sourceId}
                  >
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">
                      {entry.source?.name ?? entry.sourceId}
                      <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400 sm:ml-2 sm:mt-0 sm:inline">
                        linked {new Date(entry.addedAt).toLocaleString()}
                      </span>
                    </p>
                    <Button
                      className="w-full rounded-full sm:w-auto"
                      disabled={isSaving}
                      onClick={() => void handleUnlinkSource(entry.sourceId)}
                      type="button"
                      variant="outline"
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </AppPanelBody>
        </AppPanel>

        {error ? (
          <div className={appSurface.alert} role="alert">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className={appSurface.notice} role="status">
            {notice}
          </div>
        ) : null}
      </AppPageFrame>
    </AppPageShell>
  );
}
