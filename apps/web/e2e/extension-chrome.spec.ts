import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

async function loadExtensionShell(page: Page, packageDir: string) {
  const htmlPath = path.join(packageDir, 'sidepanel.html');
  const cssPath = path.join(packageDir, 'sidepanel.css');
  const [htmlRaw, cssRaw] = await Promise.all([
    readFile(htmlPath, 'utf8'),
    readFile(cssPath, 'utf8'),
  ]);

  const html = htmlRaw
    .replace('<link rel="stylesheet" href="sidepanel.css" />', `<style>${cssRaw}</style>`)
    .replace('<script type="module" src="sidepanel.js"></script>', '');

  await page.setContent(html, { waitUntil: 'domcontentloaded' });
}

test.describe('Chrome extension shell', () => {
  test('side panel HTML renders capture controls with neutral zinc styling', async ({ page }) => {
    const packageDir = path.resolve(__dirname, '../../extension/extension');
    await loadExtensionShell(page, packageDir);

    await expect(page.getByRole('heading', { name: 'Live context' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Capture tab' })).toBeVisible();
    await expect(page.locator('summary')).toContainText('Settings');

    const captureButton = page.getByRole('button', { name: 'Capture tab' });
    const backgroundColor = await captureButton.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    expect(backgroundColor).toBe('rgb(24, 24, 27)');

    const bodyWidth = await page.evaluate(() => document.body.getBoundingClientRect().width);
    expect(bodyWidth).toBeGreaterThanOrEqual(400);
  });
});
