import { expect, test } from '@playwright/test';
import { enableMockAuth } from './helpers/auth';

test.describe('Billing staging flows', () => {
  test('checkout from billing page returns staging pending message', async ({ page }) => {
    test.setTimeout(120_000);
    await enableMockAuth(page);
    await page.goto('/billing', { waitUntil: 'commit', timeout: 90_000 });

    await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible();

    const upgradeMonthly = page.getByTestId('pricing-select-pro_monthly');
    await expect(upgradeMonthly).toBeEnabled({ timeout: 30_000 });
    await upgradeMonthly.scrollIntoViewIfNeeded();

    const checkoutResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/billing/checkout') &&
        response.request().method() === 'POST',
      { timeout: 60_000 },
    );
    await upgradeMonthly.click();
    const response = await checkoutResponse;
    expect(response.ok()).toBeTruthy();

    await expect(
      page.getByText(/Stripe checkout is pending|Billing provider is not configured yet/i),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test('billing webhook endpoint accepts POST and returns structured payload', async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);
    await enableMockAuth(page);

    const response = await request.post('/api/v1/billing/webhooks', {
      data: { type: 'checkout.session.completed' },
      headers: { 'content-type': 'application/json' },
    });

    expect(response.status()).toBeLessThan(500);
    const payload = (await response.json()) as { data?: { status: string; received?: boolean } };
    expect(payload.data?.received ?? payload.data?.status).toBeTruthy();
  });
});
