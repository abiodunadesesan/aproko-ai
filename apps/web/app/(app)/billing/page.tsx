'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { AppPageShell } from '@/components/app/app-page-shell';
import {
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
  appSurface,
} from '@/components/app/app-surface';
import { PricingSection } from '@/components/landing/pricing-section';
import { Button } from '@/components/ui/button';
import { normalizePlanCode, type PlanCode } from '@/lib/pricing-plans';
import { cn } from '@/lib/utils';

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
    nearingLimit?: boolean;
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

  const usagePercent = useMemo(() => {
    if (!subscription?.usage || subscription.usage.unlimited) {
      return 0;
    }
    return Math.min(
      100,
      Math.round(
        (subscription.usage.used / Math.max(subscription.usage.limit ?? 1, 1)) * 100,
      ),
    );
  }, [subscription?.usage]);

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
      <AppPageFrame>
        <PricingSection
          currentPlanCode={normalizedCurrentPlan}
          mode="billing"
          onSelectPlan={(code) => void startCheckout(code)}
        />

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <AppPanel>
            <AppPanelHeader title="Subscription status" />
            <AppPanelBody className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
                  Loading subscription...
                </p>
              ) : (
                <>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className={cn(appSurface.inset, 'p-3')}>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">Plan</dt>
                      <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                        {subscription?.planCode ?? 'free'}
                      </dd>
                    </div>
                    <div className={cn(appSurface.inset, 'p-3')}>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">Status</dt>
                      <dd className="mt-1 font-medium capitalize text-zinc-900 dark:text-zinc-100">
                        {subscription?.status ?? 'active'}
                      </dd>
                    </div>
                    <div className={cn(appSurface.inset, 'p-3')}>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">Provider</dt>
                      <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                        {subscription?.provider ?? 'not configured'}
                      </dd>
                    </div>
                    <div className={cn(appSurface.inset, 'p-3')}>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">Cancel at period end</dt>
                      <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                        {subscription?.cancelAtPeriodEnd ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    <div className={cn(appSurface.inset, 'p-3 sm:col-span-2')}>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">Billing period</dt>
                      <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                        {periodLabel}
                      </dd>
                    </div>
                  </dl>

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
            </AppPanelBody>
          </AppPanel>

          <AppPanel>
            <AppPanelHeader title="Usage snapshot" />
            <AppPanelBody className="space-y-4">
              {subscription?.usage ? (
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        AI queries
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {subscription.usage.unlimited
                          ? subscription.usage.used
                          : `${subscription.usage.used} / ${subscription.usage.limit}`}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Period {subscription.usage.period}
                        {subscription.usage.unlimited ? ' · unlimited' : ''}
                      </p>
                    </div>
                    {!subscription.usage.unlimited ? (
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                        {usagePercent}%
                      </p>
                    ) : null}
                  </div>

                  {!subscription.usage.unlimited ? (
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${
                          subscription.usage.nearingLimit
                            ? 'bg-amber-500 dark:bg-amber-400'
                            : 'bg-zinc-900 dark:bg-zinc-100'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  ) : null}

                  {subscription.usage.nearingLimit ? (
                    <div className={appSurface.notice} role="status">
                      You&apos;ve used 80%+ of this month&apos;s AI queries. Upgrade anytime to avoid
                      interruptions.
                    </div>
                  ) : null}

                  <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Limits follow your effective plan
                    {subscription.usage.effectivePlanCode
                      ? ` (${subscription.usage.effectivePlanCode})`
                      : ''}
                    . Chat, writing polish, and study generation each consume one query.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Usage meters load with your subscription.
                </p>
              )}
            </AppPanelBody>
          </AppPanel>
        </div>

        {error ? (
          <div className={appSurface.alert} role="alert">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className={appSurface.notice} role="status">
            {notice}
          </div>
        ) : null}
      </AppPageFrame>
    </AppPageShell>
  );
}
