import type { Page } from '@playwright/test';

export const MOCK_AUTH_COOKIE = {
  name: 'aproko_e2e_auth',
  value: '1',
  url: 'http://localhost:3100',
};

export async function enableMockAuth(page: Page): Promise<void> {
  await page.context().addCookies([MOCK_AUTH_COOKIE]);
}
