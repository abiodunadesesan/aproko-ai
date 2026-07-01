'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { AppPageShell } from '@/components/app/app-page-shell';
import { appPageMeta } from '@/lib/navigation/app-pages';
import { EmptyState } from '@/components/app/empty-state';
import { TableSkeleton } from '@/components/app/table-skeleton';
import { buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  PENDING_DELETE_MS,
  createPendingJobId,
  isPendingJobActive,
  removeByIds,
  subtractIds,
  upsertIds,
} from '@/lib/library/pending-delete';

type Source = {
  id: string;
  name: string;
  project: string;
  folder: string;
  size: number;
  updatedAt: string | null;
};

type Project = {
  id: string;
  name: string;
  slug: string;
};

type Folder = {
  id: string;
  name: string;
  slug: string;
};

type SortField = 'name' | 'project' | 'folder' | 'size' | 'updatedAt';
type SortDirection = 'asc' | 'desc';
type SourceEditorMode = 'rename' | 'move';
type SourceDeleteMode = 'single' | 'bulk';
type TaxonomyEditorMode =
  | 'create-project'
  | 'rename-project'
  | 'delete-project'
  | 'create-folder'
  | 'rename-folder'
  | 'delete-folder';

type PendingSourceDeleteJob = {
  id: string;
  targets: Source[];
  previousSources: Source[];
};

type PendingTaxonomyDeleteJob = {
  id: string;
  mode: 'project' | 'folder';
  targetId: string;
  targetName: string;
  previousProjects: Project[];
  previousProjectId: string;
  previousFolders: Folder[];
  previousFolderId: string;
};

const WORKSPACE_ID = 'default-workspace';
const PAGE_SIZE = 10;
const buttonPrimaryClass = cn(buttonVariants({ variant: 'default' }));
const buttonSecondaryClass = cn(buttonVariants({ variant: 'outline' }));

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LibraryPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [projectId, setProjectId] = useState('');
  const [folderId, setFolderId] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [folderFilter, setFolderFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingFolder, setIsSavingFolder] = useState(false);
  const [mutatingSourceId, setMutatingSourceId] = useState<string | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [deleteModalMode, setDeleteModalMode] = useState<SourceDeleteMode | null>(null);
  const [deleteModalTargets, setDeleteModalTargets] = useState<Source[]>([]);
  const [pendingSourceDeleteJob, setPendingSourceDeleteJob] =
    useState<PendingSourceDeleteJob | null>(null);
  const [pendingTaxonomyDeleteJob, setPendingTaxonomyDeleteJob] =
    useState<PendingTaxonomyDeleteJob | null>(null);
  const [sourceEditorMode, setSourceEditorMode] = useState<SourceEditorMode | null>(null);
  const [sourceEditorTarget, setSourceEditorTarget] = useState<Source | null>(null);
  const [sourceNameDraft, setSourceNameDraft] = useState('');
  const [sourceMoveProjectId, setSourceMoveProjectId] = useState('');
  const [sourceMoveFolderId, setSourceMoveFolderId] = useState('');
  const [sourceMoveFolders, setSourceMoveFolders] = useState<Folder[]>([]);
  const [isSourceEditorLoadingFolders, setIsSourceEditorLoadingFolders] = useState(false);
  const [bulkMoveProjectId, setBulkMoveProjectId] = useState('');
  const [bulkMoveFolderId, setBulkMoveFolderId] = useState('');
  const [bulkMoveFolders, setBulkMoveFolders] = useState<Folder[]>([]);
  const [isBulkMoveLoadingFolders, setIsBulkMoveLoadingFolders] = useState(false);
  const [taxonomyEditorMode, setTaxonomyEditorMode] = useState<TaxonomyEditorMode | null>(null);
  const [taxonomyNameDraft, setTaxonomyNameDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pendingDeleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSourceDeleteJobRef = useRef<PendingSourceDeleteJob | null>(null);
  const pendingTaxonomyDeleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTaxonomyDeleteJobRef = useRef<PendingTaxonomyDeleteJob | null>(null);

  const selectedProject = useMemo(
    () => projects.find((item) => item.id === projectId) ?? null,
    [projectId, projects],
  );

  const selectedFolder = useMemo(
    () => folders.find((item) => item.id === folderId) ?? null,
    [folderId, folders],
  );

  function applySort(field: SortField) {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
        return currentField;
      }

      setSortDirection(field === 'updatedAt' ? 'desc' : 'asc');
      return field;
    });
  }

  function closeSourceEditor() {
    setSourceEditorMode(null);
    setSourceEditorTarget(null);
    setSourceNameDraft('');
    setSourceMoveProjectId('');
    setSourceMoveFolderId('');
    setSourceMoveFolders([]);
    setIsSourceEditorLoadingFolders(false);
  }

  function closeDeleteModal() {
    setDeleteModalMode(null);
    setDeleteModalTargets([]);
  }

  function closeTaxonomyEditor() {
    setTaxonomyEditorMode(null);
    setTaxonomyNameDraft('');
  }

  function clearPendingDeleteTimer() {
    if (pendingDeleteTimeoutRef.current) {
      clearTimeout(pendingDeleteTimeoutRef.current);
      pendingDeleteTimeoutRef.current = null;
    }
  }

  function clearPendingTaxonomyDeleteTimer() {
    if (pendingTaxonomyDeleteTimeoutRef.current) {
      clearTimeout(pendingTaxonomyDeleteTimeoutRef.current);
      pendingTaxonomyDeleteTimeoutRef.current = null;
    }
  }

  function toggleSourceSelection(sourceId: string) {
    setSelectedSourceIds((current) =>
      current.includes(sourceId) ? current.filter((id) => id !== sourceId) : [...current, sourceId],
    );
  }

  async function fetchFoldersByProject(nextProjectId: string): Promise<Folder[]> {
    if (!nextProjectId) {
      return [];
    }

    const res = await fetch(
      `/api/v1/workspaces/${WORKSPACE_ID}/projects/${nextProjectId}/folders`,
      {
        cache: 'no-store',
      },
    );
    const payload = await res.json();

    if (!res.ok) {
      throw new Error(payload.error || 'Failed to load folders');
    }

    return (payload.data ?? []) as Folder[];
  }

  async function loadProjects() {
    try {
      const res = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/projects`, { cache: 'no-store' });
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error || 'Failed to load projects');
      }

      const nextProjects = (payload.data ?? []) as Project[];
      setProjects(nextProjects);

      if (!nextProjects.length) {
        setProjectId('');
        setFolders([]);
        setFolderId('');
        return;
      }

      setProjectId((current) => {
        if (current && nextProjects.some((item) => item.id === current)) {
          return current;
        }
        return nextProjects[0]?.id ?? '';
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    }
  }

  async function loadFolders(nextProjectId: string) {
    if (!nextProjectId) {
      setFolders([]);
      setFolderId('');
      return;
    }

    try {
      const nextFolders = await fetchFoldersByProject(nextProjectId);
      setFolders(nextFolders);
      setFolderId((current) => {
        if (current && nextFolders.some((item) => item.id === current)) {
          return current;
        }
        return nextFolders[0]?.id ?? '';
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    }
  }

  async function loadSources() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/sources`, { cache: 'no-store' });
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error || 'Failed to load library');
      }

      setSources(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSources();
    void loadProjects();
  }, []);

  useEffect(() => {
    void loadFolders(projectId);
  }, [projectId]);

  function handleCreateProject() {
    setTaxonomyEditorMode('create-project');
    setTaxonomyNameDraft('');
    setError(null);
    setNotice(null);
  }

  function handleRenameProject() {
    if (!projectId) {
      setError('Select a project to rename.');
      return;
    }

    const current = projects.find((item) => item.id === projectId);
    setTaxonomyEditorMode('rename-project');
    setTaxonomyNameDraft(current?.name ?? '');
    setError(null);
    setNotice(null);
  }

  function handleDeleteProject() {
    if (!projectId) {
      setError('Select a project to delete.');
      return;
    }

    setTaxonomyEditorMode('delete-project');
    setTaxonomyNameDraft('');
    setError(null);
    setNotice(null);
  }

  function handleCreateFolder() {
    if (!projectId) {
      setError('Select or create a project before adding a folder.');
      return;
    }

    setTaxonomyEditorMode('create-folder');
    setTaxonomyNameDraft('');
    setError(null);
    setNotice(null);
  }

  function handleRenameFolder() {
    if (!folderId) {
      setError('Select a folder to rename.');
      return;
    }

    const current = folders.find((item) => item.id === folderId);
    setTaxonomyEditorMode('rename-folder');
    setTaxonomyNameDraft(current?.name ?? '');
    setError(null);
    setNotice(null);
  }

  function handleDeleteFolder() {
    if (!folderId) {
      setError('Select a folder to delete.');
      return;
    }

    setTaxonomyEditorMode('delete-folder');
    setTaxonomyNameDraft('');
    setError(null);
    setNotice(null);
  }

  async function submitTaxonomyEditor() {
    if (!taxonomyEditorMode) {
      return;
    }

    const nameRequired = [
      'create-project',
      'rename-project',
      'create-folder',
      'rename-folder',
    ].includes(taxonomyEditorMode);

    if (nameRequired && !taxonomyNameDraft.trim()) {
      setError('Name is required.');
      return;
    }

    setError(null);
    setNotice(null);

    if (taxonomyEditorMode === 'create-project') {
      setIsSavingProject(true);
      try {
        const res = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/projects`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: taxonomyNameDraft.trim() }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Failed to create project');

        const created = payload.data as Project;
        setProjects((current) =>
          [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setProjectId(created.id);
        setFolders([]);
        setFolderId('');
        setNotice(`Project "${created.name}" created.`);
        closeTaxonomyEditor();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create project');
      } finally {
        setIsSavingProject(false);
      }
      return;
    }

    if (taxonomyEditorMode === 'rename-project') {
      if (!projectId) {
        setError('Select a project to rename.');
        return;
      }

      setIsSavingProject(true);
      const optimisticName = taxonomyNameDraft.trim();
      const previousProjects = projects;
      setProjects((current) =>
        current
          .map((item) => (item.id === projectId ? { ...item, name: optimisticName } : item))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );

      try {
        const res = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: optimisticName }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Failed to rename project');

        const updated = payload.data as Project;
        setProjects((current) =>
          current
            .map((item) =>
              item.id === projectId ? { ...item, name: updated.name, slug: updated.slug } : item,
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setNotice(`Project renamed to "${updated.name}".`);
        await loadSources();
        closeTaxonomyEditor();
      } catch (err) {
        setProjects(previousProjects);
        setError(err instanceof Error ? err.message : 'Failed to rename project');
      } finally {
        setIsSavingProject(false);
      }
      return;
    }

    if (taxonomyEditorMode === 'delete-project') {
      if (!projectId) {
        setError('Select a project to delete.');
        return;
      }

      if (pendingTaxonomyDeleteJob) {
        setError('Resolve the pending taxonomy delete first (undo or wait).');
        return;
      }

      const currentProject = projects.find((item) => item.id === projectId);
      const previousProjects = projects;
      const previousProjectId = projectId;
      const previousFolders = folders;
      const previousFolderId = folderId;
      setProjects((current) => current.filter((item) => item.id !== projectId));
      setProjectId('');
      setFolders([]);
      setFolderId('');

      const job: PendingTaxonomyDeleteJob = {
        id: createPendingJobId(),
        mode: 'project',
        targetId: projectId,
        targetName: currentProject?.name ?? 'project',
        previousProjects,
        previousProjectId,
        previousFolders,
        previousFolderId,
      };

      setPendingTaxonomyDeleteJob(job);
      pendingTaxonomyDeleteJobRef.current = job;
      setNotice(`Project "${job.targetName}" queued for deletion. Undo available for 5 seconds.`);
      closeTaxonomyEditor();

      clearPendingTaxonomyDeleteTimer();
      pendingTaxonomyDeleteTimeoutRef.current = setTimeout(() => {
        void finalizePendingTaxonomyDelete(job);
      }, PENDING_DELETE_MS);
      return;
    }

    if (taxonomyEditorMode === 'create-folder') {
      if (!projectId) {
        setError('Select or create a project before adding a folder.');
        return;
      }

      setIsSavingFolder(true);
      try {
        const res = await fetch(
          `/api/v1/workspaces/${WORKSPACE_ID}/projects/${projectId}/folders`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: taxonomyNameDraft.trim() }),
          },
        );
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Failed to create folder');

        const created = payload.data as Folder;
        setFolders((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
        setFolderId(created.id);
        setNotice(`Folder "${created.name}" created.`);
        closeTaxonomyEditor();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create folder');
      } finally {
        setIsSavingFolder(false);
      }
      return;
    }

    if (taxonomyEditorMode === 'rename-folder') {
      if (!folderId) {
        setError('Select a folder to rename.');
        return;
      }

      setIsSavingFolder(true);
      const optimisticName = taxonomyNameDraft.trim();
      const previousFolders = folders;
      setFolders((current) =>
        current
          .map((item) => (item.id === folderId ? { ...item, name: optimisticName } : item))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );

      try {
        const res = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/folders/${folderId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: optimisticName }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Failed to rename folder');

        const updated = payload.data as Folder;
        setFolders((current) =>
          current
            .map((item) =>
              item.id === folderId ? { ...item, name: updated.name, slug: updated.slug } : item,
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setNotice(`Folder renamed to "${updated.name}".`);
        await loadSources();
        closeTaxonomyEditor();
      } catch (err) {
        setFolders(previousFolders);
        setError(err instanceof Error ? err.message : 'Failed to rename folder');
      } finally {
        setIsSavingFolder(false);
      }
      return;
    }

    if (taxonomyEditorMode === 'delete-folder') {
      if (!folderId) {
        setError('Select a folder to delete.');
        return;
      }

      if (pendingTaxonomyDeleteJob) {
        setError('Resolve the pending taxonomy delete first (undo or wait).');
        return;
      }

      const currentFolder = folders.find((item) => item.id === folderId);
      const previousFolders = folders;
      const previousFolderId = folderId;
      setFolders((current) => current.filter((item) => item.id !== folderId));
      setFolderId('');

      const job: PendingTaxonomyDeleteJob = {
        id: createPendingJobId(),
        mode: 'folder',
        targetId: folderId,
        targetName: currentFolder?.name ?? 'folder',
        previousProjects: projects,
        previousProjectId: projectId,
        previousFolders,
        previousFolderId,
      };

      setPendingTaxonomyDeleteJob(job);
      pendingTaxonomyDeleteJobRef.current = job;
      setNotice(`Folder "${job.targetName}" queued for deletion. Undo available for 5 seconds.`);
      closeTaxonomyEditor();

      clearPendingTaxonomyDeleteTimer();
      pendingTaxonomyDeleteTimeoutRef.current = setTimeout(() => {
        void finalizePendingTaxonomyDelete(job);
      }, PENDING_DELETE_MS);
    }
  }

  const sourceProjectOptions = useMemo(
    () =>
      Array.from(new Set(sources.map((item) => item.project))).sort((a, b) => a.localeCompare(b)),
    [sources],
  );

  const sourceFolderOptions = useMemo(() => {
    const filteredByProject =
      projectFilter === 'all' ? sources : sources.filter((item) => item.project === projectFilter);

    return Array.from(new Set(filteredByProject.map((item) => item.folder))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [projectFilter, sources]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError('Select a file before uploading.');
      return;
    }

    if (!projectId || !folderId) {
      setError('Select a project and folder before uploading.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('folderId', folderId);
      formData.append('project', selectedProject?.slug ?? '');
      formData.append('folder', selectedFolder?.slug ?? '');

      const res = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/sources`, {
        method: 'POST',
        body: formData,
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error || 'Upload failed');
      }

      setFile(null);
      const fileInput = event.currentTarget.querySelector(
        'input[type=file]',
      ) as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = '';
      }
      await loadSources();
      setNotice(`Uploaded "${file.name}" successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  function openRenameSourceEditor(source: Source) {
    setSourceEditorMode('rename');
    setSourceEditorTarget(source);
    setSourceNameDraft(source.name);
    setError(null);
    setNotice(null);
  }

  async function openMoveSourceEditor(source: Source) {
    setSourceEditorMode('move');
    setSourceEditorTarget(source);
    setError(null);
    setNotice(null);

    const project = projects.find((item) => item.slug === source.project) ?? null;
    const nextProjectId = project?.id ?? '';
    setSourceMoveProjectId(nextProjectId);
    setSourceMoveFolderId('');
    setSourceMoveFolders([]);

    if (!nextProjectId) {
      return;
    }

    setIsSourceEditorLoadingFolders(true);

    try {
      const nextFolders = await fetchFoldersByProject(nextProjectId);
      setSourceMoveFolders(nextFolders);
      const folder = nextFolders.find((item) => item.slug === source.folder) ?? null;
      setSourceMoveFolderId(folder?.id ?? nextFolders[0]?.id ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setIsSourceEditorLoadingFolders(false);
    }
  }

  async function handleSourceEditorProjectChange(nextProjectId: string) {
    setSourceMoveProjectId(nextProjectId);
    setSourceMoveFolderId('');
    setSourceMoveFolders([]);

    if (!nextProjectId) {
      return;
    }

    setIsSourceEditorLoadingFolders(true);

    try {
      const nextFolders = await fetchFoldersByProject(nextProjectId);
      setSourceMoveFolders(nextFolders);
      setSourceMoveFolderId(nextFolders[0]?.id ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setIsSourceEditorLoadingFolders(false);
    }
  }

  async function handleBulkMoveProjectChange(nextProjectId: string) {
    setBulkMoveProjectId(nextProjectId);
    setBulkMoveFolderId('');
    setBulkMoveFolders([]);

    if (!nextProjectId) {
      return;
    }

    setIsBulkMoveLoadingFolders(true);

    try {
      const nextFolders = await fetchFoldersByProject(nextProjectId);
      setBulkMoveFolders(nextFolders);
      setBulkMoveFolderId(nextFolders[0]?.id ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setIsBulkMoveLoadingFolders(false);
    }
  }

  async function submitSourceEditor() {
    if (!sourceEditorTarget || !sourceEditorMode) {
      return;
    }

    if (sourceEditorMode === 'rename' && !sourceNameDraft.trim()) {
      setError('Source name is required.');
      return;
    }

    if (sourceEditorMode === 'move' && (!sourceMoveProjectId || !sourceMoveFolderId)) {
      setError('Select both project and folder.');
      return;
    }

    const previousSources = sources;
    setMutatingSourceId(sourceEditorTarget.id);
    setError(null);
    setNotice(null);

    if (sourceEditorMode === 'rename') {
      const optimisticName = sourceNameDraft.trim();
      setSources((current) =>
        current.map((item) =>
          item.id === sourceEditorTarget.id ? { ...item, name: optimisticName } : item,
        ),
      );
    }

    if (sourceEditorMode === 'move') {
      const selectedProject = projects.find((item) => item.id === sourceMoveProjectId) ?? null;
      const selectedFolder =
        sourceMoveFolders.find((item) => item.id === sourceMoveFolderId) ?? null;
      setSources((current) =>
        current.map((item) =>
          item.id === sourceEditorTarget.id
            ? {
                ...item,
                project: selectedProject?.slug ?? item.project,
                folder: selectedFolder?.slug ?? item.folder,
              }
            : item,
        ),
      );
    }

    try {
      const body =
        sourceEditorMode === 'rename'
          ? { name: sourceNameDraft.trim() }
          : {
              projectId: sourceMoveProjectId,
              folderId: sourceMoveFolderId,
              project: projects.find((item) => item.id === sourceMoveProjectId)?.slug ?? null,
              folder:
                sourceMoveFolders.find((item) => item.id === sourceMoveFolderId)?.slug ?? null,
            };

      const res = await fetch(
        `/api/v1/workspaces/${WORKSPACE_ID}/sources/${sourceEditorTarget.id}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error || 'Failed to update source');
      }

      const updated = payload.source as Source;
      setSources((current) =>
        current.map((item) =>
          item.id === sourceEditorTarget.id
            ? {
                ...item,
                name: updated.name,
                project: updated.project,
                folder: updated.folder,
                updatedAt: updated.updatedAt,
              }
            : item,
        ),
      );

      if (sourceEditorMode === 'rename') {
        setNotice(`Source renamed to "${updated.name}".`);
      } else {
        setNotice(`Source moved to ${updated.project}/${updated.folder}.`);
      }

      closeSourceEditor();
    } catch (err) {
      setSources(previousSources);
      setError(err instanceof Error ? err.message : 'Failed to update source');
    } finally {
      setMutatingSourceId(null);
    }
  }

  async function submitBulkMove() {
    if (!selectedSourceIds.length) {
      setError('Select at least one source.');
      return;
    }

    if (!bulkMoveProjectId || !bulkMoveFolderId) {
      setError('Select both project and folder for bulk move.');
      return;
    }

    const selectedProject = projects.find((item) => item.id === bulkMoveProjectId) ?? null;
    const selectedFolder = bulkMoveFolders.find((item) => item.id === bulkMoveFolderId) ?? null;

    if (!selectedProject || !selectedFolder) {
      setError('Invalid project or folder selection.');
      return;
    }

    const previousSources = sources;
    setIsBulkProcessing(true);
    setError(null);
    setNotice(null);
    setSources((current) =>
      current.map((item) =>
        selectedSourceIds.includes(item.id)
          ? { ...item, project: selectedProject.slug, folder: selectedFolder.slug }
          : item,
      ),
    );

    try {
      for (const sourceId of selectedSourceIds) {
        const res = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/sources/${sourceId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            projectId: bulkMoveProjectId,
            folderId: bulkMoveFolderId,
            project: selectedProject.slug,
            folder: selectedFolder.slug,
          }),
        });
        const payload = await res.json();

        if (!res.ok) {
          throw new Error(payload.error || 'Failed to move selected sources');
        }
      }

      await loadSources();
      setSelectedSourceIds([]);
      setNotice(
        `${selectedSourceIds.length} source${selectedSourceIds.length === 1 ? '' : 's'} moved to ${selectedProject.slug}/${selectedFolder.slug}.`,
      );
    } catch (err) {
      setSources(previousSources);
      setError(err instanceof Error ? err.message : 'Failed to move selected sources');
    } finally {
      setIsBulkProcessing(false);
    }
  }

  function openDeleteSourceModal(source: Source) {
    setDeleteModalMode('single');
    setDeleteModalTargets([source]);
    setError(null);
    setNotice(null);
  }

  function openBulkDeleteModal() {
    const targets = sources.filter((item) => selectedSourceIds.includes(item.id));

    if (!targets.length) {
      setError('Select at least one source to delete.');
      return;
    }

    setDeleteModalMode('bulk');
    setDeleteModalTargets(targets);
    setError(null);
    setNotice(null);
  }

  async function confirmDeleteSources() {
    if (!deleteModalTargets.length) {
      closeDeleteModal();
      return;
    }

    const targetIds = deleteModalTargets.map((item) => item.id);
    const previousSources = sources;
    setError(null);
    setNotice(null);
    closeDeleteModal();

    if (sourceEditorTarget && targetIds.includes(sourceEditorTarget.id)) {
      closeSourceEditor();
    }

    if (pendingSourceDeleteJob) {
      setError('Resolve the pending delete first (undo or wait) before deleting more sources.');
      return;
    }

    const job: PendingSourceDeleteJob = {
      id: createPendingJobId(),
      targets: deleteModalTargets,
      previousSources,
    };

    setPendingSourceDeleteJob(job);
    pendingSourceDeleteJobRef.current = job;
    setSources((current) => removeByIds(current, targetIds));
    setSelectedSourceIds((current) => subtractIds(current, targetIds));
    setNotice(
      `${deleteModalTargets.length} source${deleteModalTargets.length === 1 ? '' : 's'} queued for deletion. Undo available for 5 seconds.`,
    );

    clearPendingDeleteTimer();
    pendingDeleteTimeoutRef.current = setTimeout(() => {
      void finalizePendingSourceDelete(job);
    }, PENDING_DELETE_MS);
  }

  async function finalizePendingSourceDelete(job: PendingSourceDeleteJob) {
    if (!isPendingJobActive(job.id, pendingSourceDeleteJobRef.current?.id)) {
      return;
    }

    setIsBulkProcessing(true);
    clearPendingDeleteTimer();

    try {
      for (const source of job.targets) {
        const res = await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/sources/${source.id}`, {
          method: 'DELETE',
        });
        const payload = await res.json();

        if (!res.ok) {
          throw new Error(payload.error || 'Failed to delete source');
        }
      }

      setNotice(`${job.targets.length} source${job.targets.length === 1 ? '' : 's'} deleted.`);
      setPendingSourceDeleteJob(null);
      pendingSourceDeleteJobRef.current = null;
    } catch (err) {
      setSources(job.previousSources);
      setSelectedSourceIds((current) =>
        upsertIds(
          current,
          job.targets.map((item) => item.id),
        ),
      );
      setError(err instanceof Error ? err.message : 'Failed to delete source');
      setPendingSourceDeleteJob(null);
      pendingSourceDeleteJobRef.current = null;
    } finally {
      setIsBulkProcessing(false);
    }
  }

  function undoPendingSourceDelete() {
    if (!pendingSourceDeleteJob) {
      return;
    }

    clearPendingDeleteTimer();
    setSources(pendingSourceDeleteJob.previousSources);
    setSelectedSourceIds((current) =>
      upsertIds(
        current,
        pendingSourceDeleteJob.targets.map((item) => item.id),
      ),
    );
    setNotice('Delete undone.');
    setPendingSourceDeleteJob(null);
    pendingSourceDeleteJobRef.current = null;
  }

  function handleDeleteSource(source: Source) {
    openDeleteSourceModal(source);
  }

  async function finalizePendingTaxonomyDelete(job: PendingTaxonomyDeleteJob) {
    if (!isPendingJobActive(job.id, pendingTaxonomyDeleteJobRef.current?.id)) {
      return;
    }

    clearPendingTaxonomyDeleteTimer();

    if (job.mode === 'project') {
      setIsSavingProject(true);
    } else {
      setIsSavingFolder(true);
    }

    try {
      const endpoint =
        job.mode === 'project'
          ? `/api/v1/workspaces/${WORKSPACE_ID}/projects/${job.targetId}`
          : `/api/v1/workspaces/${WORKSPACE_ID}/folders/${job.targetId}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to finalize delete');
      }

      setNotice(`${job.mode === 'project' ? 'Project' : 'Folder'} "${job.targetName}" deleted.`);
      await loadSources();
      setPendingTaxonomyDeleteJob(null);
      pendingTaxonomyDeleteJobRef.current = null;
    } catch (err) {
      setProjects(job.previousProjects);
      setProjectId(job.previousProjectId);
      setFolders(job.previousFolders);
      setFolderId(job.previousFolderId);
      setError(err instanceof Error ? err.message : 'Failed to finalize taxonomy delete');
      setPendingTaxonomyDeleteJob(null);
      pendingTaxonomyDeleteJobRef.current = null;
    } finally {
      if (job.mode === 'project') {
        setIsSavingProject(false);
      } else {
        setIsSavingFolder(false);
      }
    }
  }

  function undoPendingTaxonomyDelete() {
    const job = pendingTaxonomyDeleteJobRef.current;

    if (!job) {
      return;
    }

    clearPendingTaxonomyDeleteTimer();
    setProjects(job.previousProjects);
    setProjectId(job.previousProjectId);
    setFolders(job.previousFolders);
    setFolderId(job.previousFolderId);
    setPendingTaxonomyDeleteJob(null);
    pendingTaxonomyDeleteJobRef.current = null;
    setNotice('Taxonomy delete undone.');
  }

  const filteredSources = useMemo(() => {
    const normalized = query.toLowerCase().trim();

    return sources.filter((item) => {
      const matchesQuery = normalized
        ? `${item.name} ${item.project} ${item.folder}`.toLowerCase().includes(normalized)
        : true;
      const matchesProject = projectFilter === 'all' ? true : item.project === projectFilter;
      const matchesFolder = folderFilter === 'all' ? true : item.folder === folderFilter;

      return matchesQuery && matchesProject && matchesFolder;
    });
  }, [folderFilter, projectFilter, query, sources]);

  const sortedSources = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    const copy = [...filteredSources];

    copy.sort((a, b) => {
      if (sortField === 'size') {
        return (a.size - b.size) * direction;
      }

      if (sortField === 'updatedAt') {
        const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
        const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
        return (aTime - bTime) * direction;
      }

      return a[sortField].localeCompare(b[sortField]) * direction;
    });

    return copy;
  }, [filteredSources, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(sortedSources.length / PAGE_SIZE));
  const paginatedSources = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedSources.slice(start, start + PAGE_SIZE);
  }, [currentPage, sortedSources]);
  const paginatedSourceIds = useMemo(
    () => paginatedSources.map((item) => item.id),
    [paginatedSources],
  );
  const allPageSelected = useMemo(
    () =>
      paginatedSourceIds.length > 0 &&
      paginatedSourceIds.every((id) => selectedSourceIds.includes(id)),
    [paginatedSourceIds, selectedSourceIds],
  );
  const selectedProjectSlug = useMemo(
    () => projects.find((item) => item.id === projectId)?.slug ?? null,
    [projectId, projects],
  );
  const selectedFolderSlug = useMemo(
    () => folders.find((item) => item.id === folderId)?.slug ?? null,
    [folderId, folders],
  );
  const affectedProjectSourcesCount = useMemo(() => {
    if (!selectedProjectSlug) {
      return 0;
    }
    return sources.filter((source) => source.project === selectedProjectSlug).length;
  }, [selectedProjectSlug, sources]);
  const affectedFolderSourcesCount = useMemo(() => {
    if (!selectedProjectSlug || !selectedFolderSlug) {
      return 0;
    }
    return sources.filter(
      (source) => source.project === selectedProjectSlug && source.folder === selectedFolderSlug,
    ).length;
  }, [selectedFolderSlug, selectedProjectSlug, sources]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, projectFilter, folderFilter, sortField, sortDirection]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setSelectedSourceIds((current) =>
      current.filter((id) => sources.some((source) => source.id === id)),
    );
  }, [sources]);

  useEffect(() => {
    pendingSourceDeleteJobRef.current = pendingSourceDeleteJob;
  }, [pendingSourceDeleteJob]);

  useEffect(() => {
    pendingTaxonomyDeleteJobRef.current = pendingTaxonomyDeleteJob;
  }, [pendingTaxonomyDeleteJob]);

  useEffect(() => {
    return () => {
      clearPendingDeleteTimer();
      clearPendingTaxonomyDeleteTimer();
    };
  }, []);

  return (
    <AppPageShell meta={appPageMeta.library}>
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload and taxonomy</CardTitle>
            <CardDescription>
              Add new sources and keep your project-folder structure clean as your workspace grows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 md:grid-cols-[1fr_200px_200px_auto]"
              onSubmit={handleUpload}
            >
              <input
                aria-label="Upload source file"
                className="h-10 rounded-md border px-3 text-sm"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                required
              />
              <select
                aria-label="Select project for upload"
                className="h-10 rounded-md border px-3 text-sm"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                <option value="">{projects.length ? 'Select project' : 'No projects'}</option>
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Select folder for upload"
                className="h-10 rounded-md border px-3 text-sm"
                value={folderId}
                onChange={(event) => setFolderId(event.target.value)}
              >
                <option value="">{folders.length ? 'Select folder' : 'No folders'}</option>
                {folders.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button className={buttonPrimaryClass} disabled={isUploading} type="submit">
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
            <div className="mt-3 flex gap-2">
              <button
                className={buttonSecondaryClass}
                disabled={isSavingProject}
                onClick={() => void handleCreateProject()}
                type="button"
              >
                {isSavingProject ? 'Creating project...' : 'New project'}
              </button>
              <button
                className={buttonSecondaryClass}
                disabled={isSavingProject || !projectId}
                onClick={() => void handleRenameProject()}
                type="button"
              >
                Rename project
              </button>
              <button
                className={buttonSecondaryClass}
                disabled={isSavingProject || !projectId}
                onClick={() => void handleDeleteProject()}
                type="button"
              >
                Delete project
              </button>
              <button
                className={buttonSecondaryClass}
                disabled={isSavingFolder || !projectId}
                onClick={() => void handleCreateFolder()}
                type="button"
              >
                {isSavingFolder ? 'Creating folder...' : 'New folder'}
              </button>
              <button
                className={buttonSecondaryClass}
                disabled={isSavingFolder || !folderId}
                onClick={() => void handleRenameFolder()}
                type="button"
              >
                Rename folder
              </button>
              <button
                className={buttonSecondaryClass}
                disabled={isSavingFolder || !folderId}
                onClick={() => void handleDeleteFolder()}
                type="button"
              >
                Delete folder
              </button>
            </div>

            {taxonomyEditorMode ? (
              <div className="mt-3 space-y-3 rounded-md border p-3">
                <p className="text-sm font-medium">
                  {taxonomyEditorMode === 'create-project' && 'Create project'}
                  {taxonomyEditorMode === 'rename-project' && 'Rename project'}
                  {taxonomyEditorMode === 'delete-project' && 'Delete project'}
                  {taxonomyEditorMode === 'create-folder' && 'Create folder'}
                  {taxonomyEditorMode === 'rename-folder' && 'Rename folder'}
                  {taxonomyEditorMode === 'delete-folder' && 'Delete folder'}
                </p>

                {taxonomyEditorMode === 'delete-project' ? (
                  <p className="text-sm text-muted-foreground">
                    Delete selected project and its folders? This action affects{' '}
                    {affectedProjectSourcesCount} source
                    {affectedProjectSourcesCount === 1 ? '' : 's'} and cannot be undone.
                  </p>
                ) : null}
                {taxonomyEditorMode === 'delete-folder' ? (
                  <p className="text-sm text-muted-foreground">
                    Delete selected folder? This action affects {affectedFolderSourcesCount} source
                    {affectedFolderSourcesCount === 1 ? '' : 's'} and cannot be undone.
                  </p>
                ) : null}

                {taxonomyEditorMode !== 'delete-project' &&
                taxonomyEditorMode !== 'delete-folder' ? (
                  <input
                    aria-label="Taxonomy name"
                    className="h-10 w-full rounded-md border px-3 text-sm"
                    placeholder="Name"
                    value={taxonomyNameDraft}
                    onChange={(event) => setTaxonomyNameDraft(event.target.value)}
                  />
                ) : null}

                <div className="flex gap-2">
                  <button
                    className={buttonPrimaryClass}
                    disabled={isSavingProject || isSavingFolder}
                    onClick={() => void submitTaxonomyEditor()}
                    type="button"
                  >
                    {isSavingProject || isSavingFolder ? 'Saving...' : 'Confirm'}
                  </button>
                  <button
                    className={buttonSecondaryClass}
                    disabled={isSavingProject || isSavingFolder}
                    onClick={() => closeTaxonomyEditor()}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sources</CardTitle>
            <CardDescription>
              Browse, filter, and manage every uploaded source with bulk actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                aria-label="Search library sources"
                className="h-10 w-full rounded-md border px-3 text-sm md:max-w-sm"
                placeholder="Search by name, project, or folder"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <select
                  aria-label="Filter by project"
                  className="h-10 rounded-md border px-3 text-sm"
                  value={projectFilter}
                  onChange={(event) => {
                    const nextProjectFilter = event.target.value;
                    setProjectFilter(nextProjectFilter);
                    setFolderFilter('all');
                  }}
                >
                  <option value="all">All projects</option>
                  {sourceProjectOptions.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter by folder"
                  className="h-10 rounded-md border px-3 text-sm"
                  value={folderFilter}
                  onChange={(event) => setFolderFilter(event.target.value)}
                >
                  <option value="all">All folders</option>
                  {sourceFolderOptions.map((folder) => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
                <button
                  className={buttonSecondaryClass}
                  aria-label="Refresh sources list"
                  onClick={() => void loadSources()}
                  type="button"
                >
                  Refresh
                </button>
              </div>
            </div>

            {selectedSourceIds.length > 0 ? (
              <div className="mb-3 space-y-3 rounded-md border p-3">
                <p className="text-sm font-medium">
                  {selectedSourceIds.length} source{selectedSourceIds.length === 1 ? '' : 's'}{' '}
                  selected
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <select
                    aria-label="Move selected sources to project"
                    className="h-10 rounded-md border px-3 text-sm"
                    value={bulkMoveProjectId}
                    onChange={(event) => void handleBulkMoveProjectChange(event.target.value)}
                  >
                    <option value="">Move to project...</option>
                    {projects.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Move selected sources to folder"
                    className="h-10 rounded-md border px-3 text-sm"
                    value={bulkMoveFolderId}
                    onChange={(event) => setBulkMoveFolderId(event.target.value)}
                  >
                    <option value="">
                      {isBulkMoveLoadingFolders
                        ? 'Loading folders...'
                        : bulkMoveFolders.length
                          ? 'Move to folder...'
                          : 'No folders'}
                    </option>
                    {bulkMoveFolders.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={buttonPrimaryClass}
                    disabled={isBulkProcessing}
                    onClick={() => void submitBulkMove()}
                    type="button"
                  >
                    {isBulkProcessing ? 'Processing...' : 'Move selected'}
                  </button>
                  <button
                    className={buttonSecondaryClass}
                    disabled={isBulkProcessing}
                    onClick={() => openBulkDeleteModal()}
                    type="button"
                  >
                    Delete selected
                  </button>
                  <button
                    className={buttonSecondaryClass}
                    disabled={isBulkProcessing}
                    onClick={() => setSelectedSourceIds([])}
                    type="button"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            ) : null}

            {sourceEditorMode && sourceEditorTarget ? (
              <div className="mb-3 space-y-3 rounded-md border p-3">
                <p className="text-sm font-medium">
                  {sourceEditorMode === 'rename' ? 'Rename source' : 'Move source'}:{' '}
                  {sourceEditorTarget.name}
                </p>

                {sourceEditorMode === 'rename' ? (
                  <input
                    aria-label="Source name"
                    className="h-10 w-full rounded-md border px-3 text-sm"
                    value={sourceNameDraft}
                    onChange={(event) => setSourceNameDraft(event.target.value)}
                    placeholder="Source name"
                  />
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    <select
                      aria-label="Select destination project"
                      className="h-10 rounded-md border px-3 text-sm"
                      value={sourceMoveProjectId}
                      onChange={(event) => void handleSourceEditorProjectChange(event.target.value)}
                    >
                      <option value="">Select project</option>
                      {projects.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Select destination folder"
                      className="h-10 rounded-md border px-3 text-sm"
                      value={sourceMoveFolderId}
                      onChange={(event) => setSourceMoveFolderId(event.target.value)}
                    >
                      <option value="">
                        {isSourceEditorLoadingFolders
                          ? 'Loading folders...'
                          : sourceMoveFolders.length
                            ? 'Select folder'
                            : 'No folders'}
                      </option>
                      {sourceMoveFolders.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    className={buttonPrimaryClass}
                    disabled={mutatingSourceId === sourceEditorTarget.id}
                    onClick={() => void submitSourceEditor()}
                    type="button"
                  >
                    {mutatingSourceId === sourceEditorTarget.id ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className={buttonSecondaryClass}
                    disabled={mutatingSourceId === sourceEditorTarget.id}
                    onClick={() => closeSourceEditor()}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {error ? (
              <div
                className="mb-3 flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3"
                role="alert"
              >
                <p className="text-sm text-destructive">{error}</p>
                <button
                  className={buttonSecondaryClass}
                  onClick={() => void loadSources()}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : null}
            {notice ? (
              <p
                className="mb-3 rounded-md border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200"
                role="status"
              >
                {notice}
              </p>
            ) : null}
            {pendingSourceDeleteJob ? (
              <div
                className="mb-3 flex items-center justify-between gap-3 rounded-md border border-amber-600/30 bg-amber-600/10 p-3"
                role="status"
              >
                <p className="text-sm text-amber-800">
                  {pendingSourceDeleteJob.targets.length} source
                  {pendingSourceDeleteJob.targets.length === 1 ? '' : 's'} pending deletion.
                </p>
                <button
                  className={buttonSecondaryClass}
                  onClick={() => undoPendingSourceDelete()}
                  type="button"
                >
                  Undo
                </button>
              </div>
            ) : null}
            {pendingTaxonomyDeleteJob ? (
              <div
                className="mb-3 flex items-center justify-between gap-3 rounded-md border border-amber-600/30 bg-amber-600/10 p-3"
                role="status"
              >
                <p className="text-sm text-amber-800">
                  {pendingTaxonomyDeleteJob.mode === 'project' ? 'Project' : 'Folder'} "
                  {pendingTaxonomyDeleteJob.targetName}" pending deletion.
                </p>
                <button
                  className={buttonSecondaryClass}
                  onClick={() => undoPendingTaxonomyDelete()}
                  type="button"
                >
                  Undo
                </button>
              </div>
            ) : null}

            {isLoading ? (
              <TableSkeleton rows={6} />
            ) : sources.length === 0 ? (
              <EmptyState
                action={
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Use the upload form above to add your first file.
                  </p>
                }
                description="Upload PDFs, slides, and transcripts to make them searchable across chat and study."
                icon={FileText}
                title="No documents yet"
              />
            ) : filteredSources.length === 0 ? (
              <EmptyState
                compact
                action={
                  <button
                    className={`${buttonSecondaryClass} mt-1`}
                    onClick={() => {
                      setQuery('');
                      setProjectFilter('all');
                      setFolderFilter('all');
                    }}
                    type="button"
                  >
                    Clear filters
                  </button>
                }
                description="Try a different search term or reset your project and folder filters."
                icon={FileText}
                title="No matching documents"
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <p>
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}-
                    {Math.min(currentPage * PAGE_SIZE, sortedSources.length)} of{' '}
                    {sortedSources.length} results
                  </p>
                  <p>
                    Page {currentPage} of {totalPages}
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          aria-label="Select all sources on page"
                          checked={allPageSelected}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setSelectedSourceIds((current) =>
                                Array.from(new Set([...current, ...paginatedSourceIds])),
                              );
                              return;
                            }

                            setSelectedSourceIds((current) =>
                              current.filter((id) => !paginatedSourceIds.includes(id)),
                            );
                          }}
                          type="checkbox"
                        />
                      </TableHead>
                      <TableHead>
                        <button
                          className="font-medium"
                          aria-label={`Sort by name${sortField === 'name' ? `, currently ${sortDirection}` : ''}`}
                          onClick={() => applySort('name')}
                          type="button"
                        >
                          Name
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="font-medium"
                          aria-label={`Sort by project${sortField === 'project' ? `, currently ${sortDirection}` : ''}`}
                          onClick={() => applySort('project')}
                          type="button"
                        >
                          Project
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="font-medium"
                          aria-label={`Sort by folder${sortField === 'folder' ? `, currently ${sortDirection}` : ''}`}
                          onClick={() => applySort('folder')}
                          type="button"
                        >
                          Folder
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="font-medium"
                          aria-label={`Sort by size${sortField === 'size' ? `, currently ${sortDirection}` : ''}`}
                          onClick={() => applySort('size')}
                          type="button"
                        >
                          Size
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="font-medium"
                          aria-label={`Sort by updated time${sortField === 'updatedAt' ? `, currently ${sortDirection}` : ''}`}
                          onClick={() => applySort('updatedAt')}
                          type="button"
                        >
                          Updated
                        </button>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSources.map((source) => (
                      <TableRow className="transition-colors hover:bg-muted/40" key={source.id}>
                        <TableCell>
                          <input
                            aria-label={`Select ${source.name}`}
                            checked={selectedSourceIds.includes(source.id)}
                            onChange={() => toggleSourceSelection(source.id)}
                            type="checkbox"
                          />
                        </TableCell>
                        <TableCell>{source.name}</TableCell>
                        <TableCell>{source.project}</TableCell>
                        <TableCell>{source.folder}</TableCell>
                        <TableCell>{formatBytes(source.size)}</TableCell>
                        <TableCell>
                          {source.updatedAt ? new Date(source.updatedAt).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Link className="text-sm underline" href={`/library/${source.id}`}>
                              View
                            </Link>
                            <button
                              aria-label={`Rename ${source.name}`}
                              className="text-sm underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              disabled={mutatingSourceId === source.id || isBulkProcessing}
                              onClick={() => openRenameSourceEditor(source)}
                              type="button"
                            >
                              Rename
                            </button>
                            <button
                              aria-label={`Move ${source.name}`}
                              className="text-sm underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              disabled={mutatingSourceId === source.id || isBulkProcessing}
                              onClick={() => void openMoveSourceEditor(source)}
                              type="button"
                            >
                              Move
                            </button>
                            <button
                              aria-label={`Delete ${source.name}`}
                              className="text-sm text-destructive underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              disabled={mutatingSourceId === source.id || isBulkProcessing}
                              onClick={() => void handleDeleteSource(source)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-end gap-2">
                  <button
                    className={buttonSecondaryClass}
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    className={buttonSecondaryClass}
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <AlertDialog
        open={Boolean(deleteModalMode)}
        onOpenChange={(open) => !open && closeDeleteModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {deleteModalMode === 'bulk' ? 'bulk ' : ''}delete
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteModalMode === 'single'
                ? `Delete "${deleteModalTargets[0]?.name ?? 'source'}" from library?`
                : `Delete ${deleteModalTargets.length} selected sources from library?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonPrimaryClass}
              disabled={isBulkProcessing}
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteSources();
              }}
            >
              {isBulkProcessing ? 'Deleting...' : 'Confirm delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppPageShell>
  );
}
