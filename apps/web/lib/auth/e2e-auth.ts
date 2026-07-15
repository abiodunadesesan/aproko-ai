export const E2E_MOCK_USER_ID = 'e2e-user';

export function getE2EAuthUserId(request: Request): string | null {
  if (process.env.E2E_MOCK_AUTH !== 'true') {
    return null;
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  return cookieHeader.includes('aproko_e2e_auth=1') ? E2E_MOCK_USER_ID : null;
}

export async function resolveAuthUserId(
  clerkAuth: () => Promise<{ userId: string | null }>,
  request: Request,
): Promise<string | null> {
  const e2eUserId = getE2EAuthUserId(request);
  if (e2eUserId) {
    return e2eUserId;
  }

  const { userId } = await clerkAuth();
  return userId;
}
