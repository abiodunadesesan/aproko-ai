import { expect, test } from '@playwright/test';
import { enableMockAuth } from './helpers/auth';

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
  await expect(page.getByTestId('nav-link-transcripts')).toBeVisible();
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

test('protected transcripts redirects when signed out', async ({ page }) => {
  await page.goto('/transcripts', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/sign-in/);
});

test('transcripts page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/transcripts', { waitUntil: 'commit', timeout: 90_000 });

  await expect(page).toHaveURL(/\/transcripts/);
  await expect(page.getByRole('heading', { name: 'My Transcripts' })).toBeVisible();
});

test('memory page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/memory', { waitUntil: 'commit', timeout: 90_000 });

  await expect(page).toHaveURL(/\/memory/);
  await expect(page.getByRole('heading', { name: 'Memory' })).toBeVisible();
});

test('study page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/study', { waitUntil: 'commit', timeout: 90_000 });

  await expect(page).toHaveURL(/\/study/);
  await expect(page.getByRole('heading', { name: 'Study' })).toBeVisible();
});
