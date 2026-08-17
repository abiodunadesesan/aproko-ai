import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createExtensionHandoffToken, isExtensionHandoffConfigured } from '@/lib/extension/handoff-token';
import { resolveWorkspaceForUser } from '@/lib/storage/workspaces';

export async function POST() {
  if (!isExtensionHandoffConfigured()) {
    return NextResponse.json(
      { error: 'Extension handoff is not configured on the server' },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspace = await resolveWorkspaceForUser(userId);
  if (!workspace?.workspaceId) {
    return NextResponse.json({ error: 'Failed to resolve workspace' }, { status: 500 });
  }

  const token = createExtensionHandoffToken({
    userId,
    workspaceId: workspace.workspaceId,
    workspaceName: workspace.name,
    role: workspace.role,
  });

  if (!token) {
    return NextResponse.json({ error: 'Unable to create extension handoff token' }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      token,
      workspaceId: workspace.workspaceId,
      name: workspace.name,
      role: workspace.role,
    },
  });
}
