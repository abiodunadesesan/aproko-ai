'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { AppPageShell } from '@/components/app/app-page-shell';
import { PricingSection } from '@/components/landing/pricing-section';
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
  usage?: {
    period: string;
    used: number;
    limit: number | null;
    remaining: number | null;
    unlimited: boolean;
    effectivePlanCode: string;
  };
};

export default function BillingPage() {
  const { workspaceId, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace();
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
      const response = await fetch(`/api/v1/billing/subscription?workspaceId=${workspaceId}`);
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
          workspaceId: workspaceId,
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
    if (!workspaceId) {
      return;
    }
    void loadSubscription();
  }, [workspaceId]);

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

  if (isWorkspaceLoading || !workspaceId) {
    return (
      <AppPageShell pageId="billing">
        <p className="text-sm text-muted-foreground" role="status">
          {workspaceError ?? 'Resolving workspace…'}
        </p>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell pageId="billing">
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
              {subscription?.usage ? (
                <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <p>
                    <span className="text-zinc-500">Period:</span> {subscription.usage.period}
                  </p>
                  <p>
                    <span className="text-zinc-500">AI queries:</span>{' '}
                    {subscription.usage.unlimited
                      ? `${subscription.usage.used} used (unlimited)`
                      : `${subscription.usage.used} / ${subscription.usage.limit}`}
                  </p>
                  {!subscription.usage.unlimited ? (
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (subscription.usage.used / Math.max(subscription.usage.limit ?? 1, 1)) *
                                100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  ) : null}
                  <p className="text-xs text-zinc-500">
                    Limits follow your effective plan
                    {subscription.usage.effectivePlanCode
                      ? ` (${subscription.usage.effectivePlanCode})`
                      : ''}
                    . Chat messages consume one query each.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Usage meters load with your subscription.
                </p>
              )}
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
