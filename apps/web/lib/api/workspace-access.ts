import { NextResponse } from 'next/server';
import { assertWorkspaceAccess } from '@/lib/storage/workspaces';

/**
 * Returns a 403 response when the user is not a member of the workspace.
 * Call after authentication succeeds.
 *
 * Unit tests set `APROKO_TEST_BYPASS_WORKSPACE_ACCESS=1` so route handlers
 * can exercise auth/validation without a live memberships table.
 */
export async function forbidUnlessWorkspaceMember(
  userId: string,
  workspaceId: string,
): Promise<NextResponse | null> {
  if (process.env.APROKO_TEST_BYPASS_WORKSPACE_ACCESS === '1') {
    return null;
  }

  const allowed = await assertWorkspaceAccess(userId, workspaceId);
  if (allowed) {
    return null;
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
