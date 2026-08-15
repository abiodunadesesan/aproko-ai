import { expect, test } from '@playwright/test';
import { enableMockAuth } from './helpers/auth';

test('landing page loads', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible({
    timeout: 30_000,
  });
});

test('sign-in page loads', async ({ page }) => {
  const response = await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/sign-in/);
});

test('protected dashboard redirects when signed out', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 });
});

test('authenticated app shell renders with mock auth cookie', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 90_000 });

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
  await expect(page.getByTestId('app-sidebar')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 60_000 });
});

test('sidebar navigation links exist', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 90_000 });

  await expect(page.getByTestId('app-sidebar')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('nav-link-dashboard')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('nav-link-search')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('nav-link-library')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('nav-link-transcripts')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('nav-link-chat')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('nav-link-memory')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('nav-link-study')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('nav-link-writing')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('nav-link-settings')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('nav-link-billing')).toBeVisible({ timeout: 15_000 });
});

test('library page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/library', { waitUntil: 'domcontentloaded', timeout: 90_000 });

  await expect(page).toHaveURL(/\/library/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible({ timeout: 60_000 });
});

test('research page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/research', { waitUntil: 'domcontentloaded', timeout: 90_000 });

  await expect(page).toHaveURL(/\/research/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Research' })).toBeVisible({ timeout: 60_000 });
});

test('admin page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 90_000 });

  await expect(page).toHaveURL(/\/admin/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible({ timeout: 60_000 });
});

test('search page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/search', { waitUntil: 'domcontentloaded', timeout: 90_000 });

  await expect(page).toHaveURL(/\/search/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible({ timeout: 60_000 });
});

test('protected transcripts redirects when signed out', async ({ page }) => {
  await page.goto('/transcripts', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 });
});

test('transcripts page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/transcripts', { waitUntil: 'domcontentloaded', timeout: 90_000 });

  await expect(page).toHaveURL(/\/transcripts/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'My Transcripts' })).toBeVisible({
    timeout: 60_000,
  });
});

test('memory page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/memory', { waitUntil: 'domcontentloaded', timeout: 90_000 });

  await expect(page).toHaveURL(/\/memory/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Memory' })).toBeVisible({ timeout: 60_000 });
});

test('study page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/study', { waitUntil: 'domcontentloaded', timeout: 90_000 });

  await expect(page).toHaveURL(/\/study/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Study' })).toBeVisible({ timeout: 60_000 });
});

test('writing page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await enableMockAuth(page);
  await page.goto('/writing', { waitUntil: 'domcontentloaded', timeout: 90_000 });

  await expect(page).toHaveURL(/\/writing/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Writing' })).toBeVisible({ timeout: 60_000 });
});
