import { getBillingAppBaseUrl, getBillingProvider } from '@/lib/billing/billing-config';
import { createPaddleCheckoutSession } from '@/lib/billing/paddle-checkout';
import { getStripeClient } from '@/lib/billing/stripe-client';
import { getStripePriceId } from '@/lib/billing/stripe-plans';
import type { PlanCode } from '@/lib/pricing-plans';

export type CheckoutSessionRequest = {
  workspaceId: string;
  planCode: PlanCode;
  userId: string;
};

export type CheckoutSessionResult = {
  status: 'ready' | 'pending_provider';
  planCode: PlanCode;
  checkoutUrl: string | null;
  provider: string | null;
  message: string;
};

const PAID_PLAN_CODES = new Set<Exclude<PlanCode, 'free'>>(['teams', 'pro_monthly', 'pro_yearly']);

export function isPaidPlanCode(planCode: string): planCode is Exclude<PlanCode, 'free'> {
  return PAID_PLAN_CODES.has(planCode as Exclude<PlanCode, 'free'>);
}

export function parseCheckoutPlanCode(raw: unknown): PlanCode | null {
  if (typeof raw !== 'string') {
    return null;
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === 'teams' || normalized === 'pro_monthly' || normalized === 'pro_yearly') {
    return normalized;
  }

  return null;
}

async function createStripeCheckoutSession(
  request: CheckoutSessionRequest,
): Promise<CheckoutSessionResult> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey) {
    return {
      status: 'pending_provider',
      planCode: request.planCode,
      checkoutUrl: null,
      provider: 'stripe',
      message:
        'Billing provider is not configured yet. Set BILLING_PROVIDER=stripe and STRIPE_SECRET_KEY to enable checkout.',
    };
  }

  const priceId = getStripePriceId(request.planCode as Exclude<PlanCode, 'free'>);
  if (!priceId) {
    return {
      status: 'pending_provider',
      planCode: request.planCode,
      checkoutUrl: null,
      provider: 'stripe',
      message: `Stripe price ID is not configured for plan "${request.planCode}".`,
    };
  }

  const stripe = getStripeClient(stripeSecretKey);
  const baseUrl = getBillingAppBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/billing?checkout=success`,
    cancel_url: `${baseUrl}/billing?checkout=cancelled`,
    client_reference_id: request.workspaceId,
    metadata: {
      workspaceId: request.workspaceId,
      planCode: request.planCode,
      clerkUserId: request.userId,
    },
  });

  return {
    status: session.url ? 'ready' : 'pending_provider',
    planCode: request.planCode,
    checkoutUrl: session.url,
    provider: 'stripe',
    message: session.url
      ? 'Redirecting to Stripe Checkout.'
      : 'Stripe Checkout session was created without a redirect URL.',
  };
}

export async function createCheckoutSession(
  request: CheckoutSessionRequest,
): Promise<CheckoutSessionResult> {
  if (!isPaidPlanCode(request.planCode)) {
    throw new Error('Only paid plans can start checkout.');
  }

  const provider = getBillingProvider();
  if (provider === 'paddle') {
    return createPaddleCheckoutSession(request);
  }

  if (provider === 'stripe') {
    return createStripeCheckoutSession(request);
  }

  return {
    status: 'pending_provider',
    planCode: request.planCode,
    checkoutUrl: null,
    provider,
    message:
      'Billing provider is not configured yet. Set BILLING_PROVIDER=paddle (or stripe) and provider credentials.',
  };
}

export { getBillingAppBaseUrl };
