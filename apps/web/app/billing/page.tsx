'use client';

import { useEffect, useMemo, useState } from 'react';
import { buttonPrimaryClass, buttonSecondaryClass, cardClass } from '@aproko/ui';
import { AppShell } from '@/components/app-shell';

type BillingSubscription = {
  workspaceId: string;
  planCode: string;
  status: string;
  provider: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

const WORKSPACE_ID = 'default-workspace';

export default function BillingPage() {
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const periodLabel = useMemo(() => {
    if (!subscription?.currentPeriodStart || !subscription?.currentPeriodEnd) {
      return 'No active billing period';
    }

    return `${new Date(subscription.currentPeriodStart).toLocaleDateString()} - ${new Date(
      subscription.currentPeriodEnd,
    ).toLocaleDateString()}`;
  }, [subscription]);

  async function loadSubscription() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/billing/subscription?workspaceId=${WORKSPACE_ID}`);
      const payload = (await response.json()) as { data?: BillingSubscription; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to load billing subscription');
      }

      setSubscription(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load billing');
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }

  function openCheckoutPlaceholder() {
    setNotice(
      'Checkout integration is next. This baseline confirms plan visibility and billing state.',
    );
  }

  useEffect(() => {
    void loadSubscription();
  }, []);

  return (
    <AppShell subtitle="Review your plan, billing period, and subscription status." title="Billing">
      <section className="grid gap-4 lg:grid-cols-2">
        <article className={`${cardClass} space-y-3`}>
          <p className="text-sm font-semibold">Subscription</p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading subscription...</p>
          ) : (
            <>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Plan:</span>{' '}
                  {subscription?.planCode ?? 'free'}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  {subscription?.status ?? 'active'}
                </p>
                <p>
                  <span className="text-muted-foreground">Provider:</span>{' '}
                  {subscription?.provider ?? 'not configured'}
                </p>
                <p>
                  <span className="text-muted-foreground">Billing period:</span> {periodLabel}
                </p>
                <p>
                  <span className="text-muted-foreground">Cancel at period end:</span>{' '}
                  {subscription?.cancelAtPeriodEnd ? 'Yes' : 'No'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className={buttonPrimaryClass}
                  onClick={openCheckoutPlaceholder}
                  type="button"
                >
                  Upgrade / Manage Plan
                </button>
                <button
                  className={buttonSecondaryClass}
                  onClick={() => void loadSubscription()}
                  type="button"
                >
                  Refresh
                </button>
              </div>
            </>
          )}
        </article>

        <article className={`${cardClass} space-y-3`}>
          <p className="text-sm font-semibold">Usage Snapshot</p>
          <p className="text-sm text-muted-foreground">
            Billing usage meters (tokens, uploads, and workspace limits) are part of the next
            billing increment.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Current workspace: {subscription?.workspaceId ?? WORKSPACE_ID}</li>
            <li>Model usage counters: pending integration</li>
            <li>Storage usage counters: pending integration</li>
          </ul>
        </article>
      </section>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm text-emerald-700">{notice}</p> : null}
    </AppShell>
  );
}
