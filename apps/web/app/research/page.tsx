'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

const WORKSPACE_ID = 'default-workspace';

export default function ResearchPage() {
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
    const res = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/research/workspaces`, {
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
    const res = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/sources`, { cache: 'no-store' });
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
      `/api/v1/workspaces/${WORKSPACE_ID}/research/workspaces/${workspaceId}/sources`,
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
      const res = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/research/workspaces`, {
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
        `/api/v1/workspaces/${WORKSPACE_ID}/research/workspaces/${activeWorkspaceId}/sources`,
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
        `/api/v1/workspaces/${WORKSPACE_ID}/research/workspaces/${activeWorkspaceId}/sources/${encoded}`,
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

  return (
    <AppShell
      subtitle="Create focused research workspaces that combine sources, chat context, and working notes."
      title="Research"
    >
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Research Workspace</CardTitle>
            <CardDescription>
              Define a focused research context for selected sources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_2fr_auto]">
              <Input
                onChange={(event) => setTitleDraft(event.target.value)}
                placeholder="Workspace title"
                value={titleDraft}
              />
              <Textarea
                className="min-h-10"
                onChange={(event) => setDescriptionDraft(event.target.value)}
                placeholder="Description (optional)"
                value={descriptionDraft}
              />
              <Button
                disabled={isSaving || !titleDraft.trim()}
                onClick={() => void handleCreateWorkspace()}
                type="button"
              >
                {isSaving ? 'Saving...' : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace Context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-3 grid gap-2 md:grid-cols-[280px_1fr]">
              <Select
                onValueChange={(value) => setActiveWorkspaceId(value)}
                value={activeWorkspaceId}
              >
                <SelectTrigger>
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
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                {activeWorkspace
                  ? `${activeWorkspace.title} • ${activeWorkspace.description ?? 'No description'}`
                  : 'Choose a workspace to manage linked sources.'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linked Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
              <Select
                disabled={!activeWorkspaceId || !availableSources.length}
                onValueChange={(value) => setSourceToLink(value)}
                value={sourceToLink}
              >
                <SelectTrigger>
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
                disabled={!activeWorkspaceId || !sourceToLink || isSaving}
                onClick={() => void handleLinkSource()}
                type="button"
                variant="outline"
              >
                Link source
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              {linkedSourceDetails.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? 'Loading linked sources...'
                    : 'No source linked yet. Add one to scope research context.'}
                </p>
              ) : (
                linkedSourceDetails.map((entry) => (
                  <div
                    className="flex items-center justify-between rounded-md border p-3"
                    key={entry.sourceId}
                  >
                    <p className="text-sm">
                      {entry.source?.name ?? entry.sourceId}
                      <span className="ml-2 text-xs text-muted-foreground">
                        linked {new Date(entry.addedAt).toLocaleString()}
                      </span>
                    </p>
                    <Button
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
          </CardContent>
        </Card>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="rounded-md border border-emerald-300/50 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
