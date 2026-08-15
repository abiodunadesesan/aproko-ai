import { EventName, type SubscriptionNotification } from '@paddle/paddle-node-sdk';
import { getPaddleClient } from '@/lib/billing/paddle-client';
import { getPlanCodeFromPaddlePriceId } from '@/lib/billing/paddle-plans';
import type { BillingWebhookResult } from '@/lib/billing/webhooks';
import { appendBillingEvent } from '@/lib/storage/billing-events';
import {
  upsertBillingSubscription,
  type UpsertBillingSubscriptionInput,
} from '@/lib/storage/billing';
import { trackServerEvent } from '@/lib/observability/server';
import type { PlanCode } from '@/lib/pricing-plans';

function readCustomDataString(
  customData: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = customData?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function subscriptionInputFromPaddle(
  subscription: SubscriptionNotification,
): UpsertBillingSubscriptionInput | null {
  const priceId = subscription.items[0]?.price?.id ?? null;
  const planCodeFromPrice = priceId ? getPlanCodeFromPaddlePriceId(priceId) : null;
  const planCodeFromCustom = readCustomDataString(
    subscription.customData as Record<string, unknown> | null,
    'planCode',
  ) as PlanCode | null;
  const planCode = planCodeFromCustom ?? planCodeFromPrice;
  const workspaceId =
    readCustomDataString(subscription.customData as Record<string, unknown> | null, 'workspaceId') ??
    readCustomDataString(subscription.customData as Record<string, unknown> | null, 'workspace_id');

  if (!workspaceId || !planCode) {
    return null;
  }

  const effectivePlanCode =
    subscription.status === 'canceled' ? ('free' as PlanCode) : planCode;

  return {
    workspaceId,
    planCode: effectivePlanCode,
    status: subscription.status,
    provider: 'paddle',
    currentPeriodStart: subscription.currentBillingPeriod?.startsAt ?? null,
    currentPeriodEnd: subscription.currentBillingPeriod?.endsAt ?? null,
    cancelAtPeriodEnd: subscription.scheduledChange?.action === 'cancel',
  };
}

async function recordPaddleWebhookEvent(
  eventType: string,
  externalEventId: string,
  result: BillingWebhookResult,
  workspaceId: string | null = null,
) {
  await appendBillingEvent({
    workspaceId,
    provider: 'paddle',
    eventType: result.eventType ?? eventType,
    status: result.status,
    message: result.message,
    externalEventId,
  });
}

async function finalizePaddleWebhookResult(
  eventType: string,
  externalEventId: string,
  result: BillingWebhookResult,
  workspaceId: string | null = null,
): Promise<BillingWebhookResult> {
  await recordPaddleWebhookEvent(eventType, externalEventId, result, workspaceId);
  return result;
}

export async function handlePaddleBillingWebhook(request: Request): Promise<BillingWebhookResult> {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  const apiKey = process.env.PADDLE_API_KEY?.trim();

  if (!webhookSecret || !apiKey) {
    return {
      received: true,
      status: 'pending_provider',
      eventType: null,
      message:
        'Billing webhooks are not configured yet. Set BILLING_PROVIDER=paddle, PADDLE_API_KEY, and PADDLE_WEBHOOK_SECRET.',
    };
  }

  const signature = request.headers.get('paddle-signature');
  if (!signature) {
    throw new Error('Missing paddle-signature header');
  }

  const body = await request.text();
  const paddle = getPaddleClient(apiKey);
  const event = await paddle.webhooks.unmarshal(body, webhookSecret, signature);

  switch (event.eventType) {
    case EventName.SubscriptionActivated:
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionCanceled: {
      const subscription = event.data;
      const input = subscriptionInputFromPaddle(subscription);
      if (!input) {
        return finalizePaddleWebhookResult(event.eventType, event.eventId, {
          received: true,
          status: 'ignored',
          eventType: event.eventType,
          message: 'Subscription webhook ignored because workspace/plan metadata was missing.',
        });
      }

      await upsertBillingSubscription(input);

      const userId =
        readCustomDataString(subscription.customData as Record<string, unknown> | null, 'clerkUserId') ??
        input.workspaceId;
      const phEvent =
        event.eventType === EventName.SubscriptionCanceled
          ? 'subscription_cancelled'
          : event.eventType === EventName.SubscriptionActivated
            ? 'subscription_activated'
            : 'subscription_updated';

      await trackServerEvent({
        event: phEvent,
        distinctId: userId,
        properties: {
          plan_code: input.planCode,
          workspace_id: input.workspaceId,
          provider: 'paddle',
          paddle_subscription_id: subscription.id,
          cancel_at_period_end: input.cancelAtPeriodEnd,
        },
      });

      return finalizePaddleWebhookResult(
        event.eventType,
        event.eventId,
        {
          received: true,
          status: 'processed',
          eventType: event.eventType,
          message: 'Subscription state synced from Paddle webhook.',
        },
        input.workspaceId,
      );
    }
    default:
      return finalizePaddleWebhookResult(event.eventType, event.eventId, {
        received: true,
        status: 'ignored',
        eventType: event.eventType,
        message: 'Webhook received and ignored.',
      });
  }
}
