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

    await expect(page.getByTestId('library-upload-project')).toHaveValue('proj-e2e', {
      timeout: 30_000,
    });
    await expect(page.getByTestId('library-upload-folder')).toHaveValue('folder-e2e', {
      timeout: 30_000,
    });

    const fileInput = page.getByTestId('library-upload-file');
    await fileInput.setInputFiles({
      name: 'e2e-upload.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('E2E library upload content'),
    });

    await page.getByTestId('library-upload-project').selectOption('proj-e2e');
    await page.getByTestId('library-upload-folder').selectOption('folder-e2e');
    await page.getByTestId('library-upload-submit').click();

    await expect(page.getByText(/Uploaded "e2e-upload.txt" successfully/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('library-sources-table')).toContainText('e2e-upload.txt');
  });

  test('chat with citations: assistant response shows source citation', async ({ page }) => {
    test.setTimeout(120_000);
    await enableMockAuth(page);
    await installWorkspaceMocks(page);
    await page.goto('/chat?new=1', { waitUntil: 'commit', timeout: 90_000 });

    await expect(page.getByTestId('chat-welcome')).toBeVisible();
    await expect(page.getByTestId('chat-input')).toBeVisible();

    const chatInput = page.getByTestId('chat-input');
    await chatInput.click();
    await chatInput.pressSequentially('What is object-oriented programming?', { delay: 25 });

    const sessionResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/chat/sessions') &&
        response.request().method() === 'POST' &&
        !response.url().includes('/messages'),
      { timeout: 60_000 },
    );
    const messageResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/chat/sessions/') &&
        response.url().includes('/messages') &&
        response.request().method() === 'POST',
      { timeout: 60_000 },
    );

    await expect(page.getByTestId('chat-send')).toBeEnabled({ timeout: 15_000 });
    await page.getByTestId('chat-send').click();

    expect((await sessionResponse).ok()).toBeTruthy();
    expect((await messageResponse).ok()).toBeTruthy();

    await expect(page.getByTestId('chat-assistant-message')).toContainText(
      /object-oriented programming/i,
      { timeout: 30_000 },
    );
    await expect(page.getByTestId('chat-citation')).toContainText('OOP Lecture Notes.pdf');
  });
});
