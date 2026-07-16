'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type WorkspaceContextValue = {
  workspaceId: string | null;
  name: string | null;
  role: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/workspaces/current', { cache: 'no-store' });
      const payload = (await response.json()) as {
        data?: { workspaceId?: string; name?: string; role?: string };
        error?: string;
      };
      if (!response.ok || !payload.data?.workspaceId) {
        throw new Error(payload.error ?? 'Failed to resolve workspace');
      }
      setWorkspaceId(payload.data.workspaceId);
      setName(payload.data.name ?? null);
      setRole(payload.data.role ?? null);
    } catch (loadError) {
      setWorkspaceId(null);
      setName(null);
      setRole(null);
      setError(loadError instanceof Error ? loadError.message : 'Failed to resolve workspace');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(
    () => ({
      workspaceId,
      name,
      role,
      isLoading,
      error,
      refresh,
    }),
    [workspaceId, name, role, isLoading, error],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}

/** Convenience: returns workspace id when ready, else null. */
export function useWorkspaceId(): string | null {
  return useWorkspace().workspaceId;
}
