export function isAdminUser(userId: string | null): boolean {
  if (!userId) {
    return false;
  }

  const allowAllDev = process.env.ADMIN_ALLOW_ALL_DEV === 'true';
  if (allowAllDev && process.env.NODE_ENV !== 'production') {
    return true;
  }

  const rawIds = process.env.ADMIN_CLERK_USER_IDS ?? '';
  const adminIds = rawIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  return adminIds.includes(userId);
}
