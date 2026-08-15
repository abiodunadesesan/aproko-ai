import { getBillingAppBaseUrl } from '@/lib/billing/billing-config';
import { getPaddleClient } from '@/lib/billing/paddle-client';
import { getPaddlePriceId } from '@/lib/billing/paddle-plans';
import type { CheckoutSessionRequest, CheckoutSessionResult } from '@/lib/billing/checkout';
import type { PlanCode } from '@/lib/pricing-plans';

export async function createPaddleCheckoutSession(
  request: CheckoutSessionRequest,
): Promise<CheckoutSessionResult> {
  const apiKey = process.env.PADDLE_API_KEY?.trim();
  if (!apiKey) {
    return {
      status: 'pending_provider',
      planCode: request.planCode,
      checkoutUrl: null,
      provider: 'paddle',
      message:
        'Billing provider is not configured yet. Set BILLING_PROVIDER=paddle and PADDLE_API_KEY to enable checkout.',
    };
  }

  const priceId = getPaddlePriceId(request.planCode as Exclude<PlanCode, 'free'>);
  if (!priceId) {
    return {
      status: 'pending_provider',
      planCode: request.planCode,
      checkoutUrl: null,
      provider: 'paddle',
      message: `Paddle price ID is not configured for plan "${request.planCode}".`,
    };
  }

  const paddle = getPaddleClient(apiKey);
  const baseUrl = getBillingAppBaseUrl();
  const transaction = await paddle.transactions.create({
    items: [{ priceId, quantity: 1 }],
    customData: {
      workspaceId: request.workspaceId,
      planCode: request.planCode,
      clerkUserId: request.userId,
    },
    checkout: {
      url: `${baseUrl}/billing`,
    },
  });

  const checkoutUrl = transaction.checkout?.url ?? null;

  return {
    status: checkoutUrl ? 'ready' : 'pending_provider',
    planCode: request.planCode,
    checkoutUrl,
    provider: 'paddle',
    message: checkoutUrl
      ? 'Redirecting to Paddle Checkout.'
      : 'Paddle transaction was created without a checkout URL. Confirm your default payment link domain in Paddle.',
  };
}
