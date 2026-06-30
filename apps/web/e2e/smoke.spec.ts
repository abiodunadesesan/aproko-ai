import { expect, test, type Page } from '@playwright/test';

const MOCK_AUTH_COOKIE = {
  name: 'aproko_e2e_auth',
  value: '1',
  url: 'http://localhost:3100',
};

async function enableMockAuth(page: Page): Promise<void> {
  await page.context().addCookies([MOCK_AUTH_COOKIE]);
}

test('landing page loads', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'commit' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/$/);
});

test('sign-in page loads', async ({ page }) => {
  const response = await page.goto('/sign-in', { waitUntil: 'commit' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/sign-in/);
});

test('protected dashboard redirects when signed out', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/sign-in/);
});

test('authenticated app shell renders with mock auth cookie', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/dashboard', { waitUntil: 'commit', timeout: 90_000 });

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByTestId('app-sidebar')).toBeVisible();
});

test('sidebar navigation links exist', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/dashboard', { waitUntil: 'commit', timeout: 90_000 });

  await expect(page.getByTestId('nav-link-dashboard')).toBeVisible();
  await expect(page.getByTestId('nav-link-search')).toBeVisible();
  await expect(page.getByTestId('nav-link-library')).toBeVisible();
  await expect(page.getByTestId('nav-link-chat')).toBeVisible();
  await expect(page.getByTestId('nav-link-memory')).toBeVisible();
  await expect(page.getByTestId('nav-link-study')).toBeVisible();
  await expect(page.getByTestId('nav-link-settings')).toBeVisible();
  await expect(page.getByTestId('nav-link-billing')).toBeVisible();
});

test('library page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/library', { waitUntil: 'commit', timeout: 90_000 });

  await expect(page).toHaveURL(/\/library/);
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
});

test('research page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/research', { waitUntil: 'commit', timeout: 90_000 });

  await expect(page).toHaveURL(/\/research/);
  await expect(page.getByRole('heading', { name: 'Research' })).toBeVisible();
});

test('admin page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/admin', { waitUntil: 'commit', timeout: 90_000 });

  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
});

test('search page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/search', { waitUntil: 'commit', timeout: 90_000 });

  await expect(page).toHaveURL(/\/search/);
  await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();
});
