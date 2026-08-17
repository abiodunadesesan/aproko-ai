import { expect, test } from '@playwright/test';
import { enableMockAuth } from './helpers/auth';
import { installExtensionLiveMocks, postMockLiveContext } from './helpers/extension-mocks';

test.describe('Extension live context embed UI', () => {
  test('embed panel shows sign-in guidance when workspace is unavailable', async ({ page }) => {
    test.setTimeout(120_000);
    await enableMockAuth(page);
    await page.route(/\/api\/v1\/workspaces\/current\/?$/, async (route) => {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
    });

    await page.goto('/extension/live?embed=1', { waitUntil: 'commit', timeout: 90_000 });
    await expect(page.getByText('Sign in required')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('link', { name: 'Open Aproko tab' })).toBeVisible();
  });

  test('embed panel renders synced context and streams assistant reply', async ({ page }) => {
    test.setTimeout(120_000);
    await enableMockAuth(page);
    await installExtensionLiveMocks(page);

    await page.goto('/extension/live?embed=1', { waitUntil: 'commit', timeout: 90_000 });
    await expect(page.getByRole('heading', { name: 'Ask about this page' })).toBeVisible({
      timeout: 30_000,
    });
    await postMockLiveContext(page);

    await expect(page.getByText('Example Quiz', { exact: true }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('Cursor focus')).toBeVisible();

    const askInput = page.getByPlaceholder('Ask about the synced page');
    await askInput.fill('what is happening on this page');
    await page.getByRole('button', { name: 'Ask' }).click();

    await expect(page.getByText(/Live context answer for: what is happening on this page/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('Stream error')).toHaveCount(0);
  });

  test('embed panel uses neutral zinc styling (no orange accent buttons)', async ({ page }) => {
    test.setTimeout(120_000);
    await enableMockAuth(page);
    await installExtensionLiveMocks(page);
    await page.goto('/extension/live?embed=1', { waitUntil: 'commit', timeout: 90_000 });

    const askButton = page.getByRole('button', { name: 'Ask' });
    await expect(askButton).toBeVisible({ timeout: 30_000 });

    const backgroundColor = await askButton.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(backgroundColor).not.toMatch(/rgb\(217, 119, 6\)|rgb\(245, 158, 11\)/);
  });

  test('embed panel in iframe hides full app sidebar', async ({ page }) => {
    test.setTimeout(120_000);
    await enableMockAuth(page);
    await installExtensionLiveMocks(page);

    await page.setContent(
      `<iframe id="embed" src="/extension/live?embed=1" style="width:480px;height:720px;border:0"></iframe>`,
      { waitUntil: 'domcontentloaded' },
    );

    const frame = page.frameLocator('#embed');
    await expect(frame.getByRole('heading', { name: 'Ask about this page' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(frame.getByTestId('app-sidebar')).toHaveCount(0);
  });

  test('connect page in iframe shows panel-safe guidance without app sidebar', async ({ page }) => {
    test.setTimeout(120_000);
    await enableMockAuth(page);

    await page.setContent(
      `<iframe id="embed" src="/extension/connect?from=extension" style="width:480px;height:720px;border:0"></iframe>`,
      { waitUntil: 'domcontentloaded' },
    );

    const frame = page.frameLocator('#embed');
    await expect(frame.getByText('Open this page in a full browser tab')).toBeVisible({
      timeout: 30_000,
    });
    await expect(frame.getByRole('button', { name: 'Open in browser tab' })).toBeVisible();
    await expect(frame.getByTestId('app-sidebar')).toHaveCount(0);
  });
});
