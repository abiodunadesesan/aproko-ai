export type BillingProvider = 'stripe' | 'paddle';

export function getBillingProvider(): BillingProvider | null {
  const provider = process.env.BILLING_PROVIDER?.trim().toLowerCase();
  if (provider === 'stripe' || provider === 'paddle') {
    return provider;
  }

  return null;
}

export function getBillingAppBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  return configured.replace(/\/$/, '') || 'http://localhost:3000';
}
