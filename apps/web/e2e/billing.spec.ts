import { expect, test } from '@playwright/test';
import { enableMockAuth } from './helpers/auth';
import { installBillingMocks } from './helpers/mock-api';

test.describe('Billing staging flows', () => {
  test('checkout from billing page returns staging pending message', async ({ page }) => {
    test.setTimeout(120_000);
    await enableMockAuth(page);
    await installBillingMocks(page);
    await page.goto('/billing', { waitUntil: 'commit', timeout: 90_000 });

    await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible();
    await page.getByTestId('pricing-select-pro_monthly').click();

    await expect(page.getByText(/Stripe checkout is pending in staging/i)).toBeVisible();
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
