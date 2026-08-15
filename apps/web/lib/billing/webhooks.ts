import type Stripe from 'stripe';
import { getBillingProvider } from '@/lib/billing/billing-config';
import { handlePaddleBillingWebhook } from '@/lib/billing/paddle-webhooks';
import { getStripeClient } from '@/lib/billing/stripe-client';
import { getPlanCodeFromStripePriceId } from '@/lib/billing/stripe-plans';
import { appendBillingEvent } from '@/lib/storage/billing-events';
import {
  upsertBillingSubscription,
  type UpsertBillingSubscriptionInput,
} from '@/lib/storage/billing';
import { trackServerEvent } from '@/lib/observability/server';

export type BillingWebhookResult = {
  received: true;
  status: 'ignored' | 'processed' | 'pending_provider';
  eventType: string | null;
  message: string;
};

function unixToIso(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) {
    return null;
  }

  return new Date(unixSeconds * 1000).toISOString();
}

function subscriptionInputFromStripe(
  subscription: Stripe.Subscription,
  fallbackWorkspaceId?: string | null,
): UpsertBillingSubscriptionInput | null {
  const subscriptionItem = subscription.items.data[0];
  const priceId = subscriptionItem?.price.id;
  const planCode = priceId ? getPlanCodeFromStripePriceId(priceId) : null;
  const workspaceId =
    subscription.metadata.workspaceId ||
    fallbackWorkspaceId ||
    subscription.metadata.workspace_id ||
    null;

  if (!workspaceId || !planCode) {
    return null;
  }

  return {
    workspaceId,
    planCode,
    status: subscription.status,
    provider: 'stripe',
    currentPeriodStart: unixToIso(subscriptionItem?.current_period_start),
    currentPeriodEnd: unixToIso(subscriptionItem?.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  fallbackWorkspaceId?: string | null,
): Promise<boolean> {
  const input = subscriptionInputFromStripe(subscription, fallbackWorkspaceId);
  if (!input) {
    return false;
  }

  await upsertBillingSubscription(input);
  return true;
}

async function recordBillingWebhookEvent(
  event: Stripe.Event,
  result: BillingWebhookResult,
  workspaceId: string | null = null,
) {
  await appendBillingEvent({
    workspaceId,
    provider: 'stripe',
    eventType: result.eventType ?? event.type,
    status: result.status,
    message: result.message,
    externalEventId: event.id,
  });
}

async function finalizeStripeWebhookResult(
  event: Stripe.Event,
  result: BillingWebhookResult,
  workspaceId: string | null = null,
): Promise<BillingWebhookResult> {
  await recordBillingWebhookEvent(event, result, workspaceId);
  return result;
}

async function handleStripeBillingWebhook(request: Request): Promise<BillingWebhookResult> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!webhookSecret || !stripeSecretKey) {
    return {
      received: true,
      status: 'pending_provider',
      eventType: null,
      message:
        'Billing webhooks are not configured yet. Set BILLING_PROVIDER=stripe, STRIPE_SECRET_KEY, and STRIPE_WEBHOOK_SECRET.',
    };
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    throw new Error('Missing stripe-signature header');
  }

  const body = await request.text();
  const stripe = getStripeClient(stripeSecretKey);
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

      if (!subscriptionId) {
        return finalizeStripeWebhookResult(
          event,
          {
            received: true,
            status: 'ignored',
            eventType: event.type,
            message: 'Checkout session completed without a subscription reference.',
          },
          session.client_reference_id ?? null,
        );
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const synced = await syncStripeSubscription(subscription, session.client_reference_id);
      if (synced) {
        const subInput = subscriptionInputFromStripe(subscription, session.client_reference_id);
        const userId =
          subscription.metadata.clerkUserId ?? session.client_reference_id ?? 'unknown';
        await trackServerEvent({
          event: 'subscription_activated',
          distinctId: userId,
          properties: {
            plan_code: subInput?.planCode,
            workspace_id: subInput?.workspaceId,
            provider: 'stripe',
            stripe_subscription_id: subscriptionId,
          },
        });
      }
      return finalizeStripeWebhookResult(
        event,
        {
          received: true,
          status: synced ? 'processed' : 'ignored',
          eventType: event.type,
          message: synced
            ? 'Subscription synced from checkout session.'
            : 'Checkout session could not be mapped to a workspace subscription.',
        },
        subscriptionInputFromStripe(subscription, session.client_reference_id)?.workspaceId ??
          session.client_reference_id ??
          null,
      );
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const synced = await syncStripeSubscription(subscription);
      if (synced) {
        const subInput = subscriptionInputFromStripe(subscription);
        const userId = subscription.metadata.clerkUserId ?? subInput?.workspaceId ?? 'unknown';
        const phEvent =
          event.type === 'customer.subscription.deleted'
            ? 'subscription_cancelled'
            : 'subscription_updated';
        await trackServerEvent({
          event: phEvent,
          distinctId: userId,
          properties: {
            plan_code: subInput?.planCode,
            workspace_id: subInput?.workspaceId,
            provider: 'stripe',
            stripe_subscription_id: typeof subscription.id === 'string' ? subscription.id : null,
            cancel_at_period_end: subInput?.cancelAtPeriodEnd,
          },
        });
      }
      return finalizeStripeWebhookResult(
        event,
        {
          received: true,
          status: synced ? 'processed' : 'ignored',
          eventType: event.type,
          message: synced
            ? 'Subscription state synced from Stripe webhook.'
            : 'Subscription webhook ignored because workspace/plan metadata was missing.',
        },
        subscriptionInputFromStripe(subscription)?.workspaceId ?? null,
      );
    }
    default:
      return finalizeStripeWebhookResult(event, {
        received: true,
        status: 'ignored',
        eventType: event.type,
        message: 'Webhook received and ignored.',
      });
  }
}

export async function handleBillingWebhook(request: Request): Promise<BillingWebhookResult> {
  const provider = getBillingProvider();
  if (provider === 'paddle') {
    return handlePaddleBillingWebhook(request);
  }

  if (provider === 'stripe') {
    return handleStripeBillingWebhook(request);
  }

  return {
    received: true,
    status: 'pending_provider',
    eventType: null,
    message:
      'Billing webhooks are not configured yet. Set BILLING_PROVIDER=paddle (or stripe) and provider credentials.',
  };
}
