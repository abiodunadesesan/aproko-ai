import { expect, test } from '@playwright/test';
import { enableMockAuth } from './helpers/auth';
import { installWorkspaceMocks } from './helpers/mock-api';

test.describe('Critical user journeys', () => {
  test('auth to dashboard: mock auth reaches dashboard shell', async ({ page }) => {
    test.setTimeout(120_000);
    await enableMockAuth(page);
    await page.goto('/dashboard', { waitUntil: 'commit', timeout: 90_000 });

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByTestId('app-sidebar')).toBeVisible();
    await expect(page.getByTestId('nav-link-library')).toBeVisible();
  });

  test('library upload: file appears in sources table', async ({ page }) => {
    test.setTimeout(120_000);
    await enableMockAuth(page);
    await installWorkspaceMocks(page);
    await page.goto('/library', { waitUntil: 'commit', timeout: 90_000 });

    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();

    const fileInput = page.getByTestId('library-upload-file');
    await fileInput.setInputFiles({
      name: 'e2e-upload.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('E2E library upload content'),
    });

    await page.getByTestId('library-upload-project').selectOption('proj-e2e');
    await page.getByTestId('library-upload-folder').selectOption('folder-e2e');
    await page.getByTestId('library-upload-submit').click();

    await expect(page.getByText(/Uploaded "e2e-upload.txt" successfully/i)).toBeVisible();
    await expect(page.getByTestId('library-sources-table')).toContainText('e2e-upload.txt');
  });

  test('chat with citations: assistant response shows source citation', async ({ page }) => {
    test.setTimeout(120_000);
    await enableMockAuth(page);
    await installWorkspaceMocks(page);
    await page.goto('/chat', { waitUntil: 'commit', timeout: 90_000 });

    await expect(page.getByRole('heading', { name: 'Chat' })).toBeVisible();

    await page.getByTestId('chat-input').fill('What is object-oriented programming?');
    await page.getByTestId('chat-send').click();

    await expect(page.getByTestId('chat-assistant-message')).toContainText(
      /object-oriented programming/i,
    );
    await expect(page.getByTestId('chat-citation')).toContainText('OOP Lecture Notes.pdf');
  });
});
