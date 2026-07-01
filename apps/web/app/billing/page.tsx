'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppPageShell } from '@/components/app/app-page-shell';
import { PricingSection } from '@/components/landing/pricing-section';
import { appPageMeta } from '@/lib/navigation/app-pages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { normalizePlanCode, type PlanCode } from '@/lib/pricing-plans';

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
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
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

  const normalizedCurrentPlan = useMemo(
    () => normalizePlanCode(subscription?.planCode),
    [subscription?.planCode],
  );

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

  async function startCheckout(code: PlanCode) {
    if (code === 'free') {
      return;
    }

    if (code === normalizedCurrentPlan) {
      setNotice('You are already on this plan.');
      setError(null);
      return;
    }

    setIsStartingCheckout(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          workspaceId: WORKSPACE_ID,
          planCode: code,
        }),
      });
      const payload = (await response.json()) as {
        data?: {
          checkoutUrl: string | null;
          message: string;
        };
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to start checkout');
      }

      if (payload.data.checkoutUrl) {
        window.location.assign(payload.data.checkoutUrl);
        return;
      }

      setNotice(payload.data.message);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Failed to start checkout');
    } finally {
      setIsStartingCheckout(false);
    }
  }

  useEffect(() => {
    void loadSubscription();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkoutState = new URLSearchParams(window.location.search).get('checkout');
    if (checkoutState === 'success') {
      setNotice('Checkout completed. Your subscription will update shortly.');
    } else if (checkoutState === 'cancelled') {
      setNotice('Checkout was cancelled. No changes were made to your plan.');
    }
  }, []);

  return (
    <AppPageShell meta={appPageMeta.billing}>
      <section className="space-y-6 sm:space-y-8">
        <PricingSection
          currentPlanCode={normalizedCurrentPlan}
          mode="billing"
          onSelectPlan={(code) => void startCheckout(code)}
        />

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Card className="border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Subscription status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
              {isLoading ? (
                <p className="text-sm text-muted-foreground" role="status">
                  Loading subscription...
                </p>
              ) : (
                <>
                  <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    <p>
                      <span className="text-zinc-500">Plan:</span>{' '}
                      {subscription?.planCode ?? 'free'}
                    </p>
                    <p>
                      <span className="text-zinc-500">Status:</span>{' '}
                      {subscription?.status ?? 'active'}
                    </p>
                    <p>
                      <span className="text-zinc-500">Provider:</span>{' '}
                      {subscription?.provider ?? 'not configured'}
                    </p>
                    <p>
                      <span className="text-zinc-500">Billing period:</span> {periodLabel}
                    </p>
                    <p>
                      <span className="text-zinc-500">Cancel at period end:</span>{' '}
                      {subscription?.cancelAtPeriodEnd ? 'Yes' : 'No'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      className="w-full rounded-full transition-transform hover:-translate-y-0.5 sm:w-auto"
                      disabled={isStartingCheckout}
                      onClick={() => void startCheckout(normalizedCurrentPlan)}
                      type="button"
                    >
                      {isStartingCheckout ? 'Starting checkout...' : 'Manage subscription'}
                    </Button>
                    <Button
                      className="w-full rounded-full sm:w-auto"
                      onClick={() => void loadSubscription()}
                      type="button"
                      variant="outline"
                    >
                      Refresh
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Usage snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Billing usage meters (tokens, uploads, and workspace limits) are part of the next
                billing increment.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Current workspace: {subscription?.workspaceId ?? WORKSPACE_ID}</li>
                <li>Model usage counters: pending integration</li>
                <li>Storage usage counters: pending integration</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {error ? (
        <div
          className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {notice ? (
        <div
          className="mt-4 rounded-md border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200"
          role="status"
        >
          {notice}
        </div>
      ) : null}
    </AppPageShell>
  );
}
