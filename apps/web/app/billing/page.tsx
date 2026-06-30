'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
type PricingPlan = {
  code: 'free' | 'pro_monthly' | 'pro_yearly';
  title: string;
  price: string;
  period: string;
  highlights: string[];
  cta: string;
  badge?: string;
};

const plans: PricingPlan[] = [
  {
    code: 'free',
    title: 'Free',
    price: '$0',
    period: '/forever',
    highlights: ['Core workspace', 'Limited AI queries', 'Basic memory timeline'],
    cta: 'Current baseline',
  },
  {
    code: 'pro_monthly',
    title: 'Pro (Monthly)',
    price: '$20',
    period: '/mo',
    highlights: ['Unlimited AI queries', 'Live transcription', 'Flashcards + quizzes'],
    cta: 'Upgrade monthly',
  },
  {
    code: 'pro_yearly',
    title: 'Pro (Yearly)',
    price: '$160',
    period: '/yr',
    highlights: ['All Pro features', 'Lower annual cost', 'Priority support'],
    cta: 'Upgrade yearly',
    badge: 'Best value',
  },
] as const;

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
  const normalizedCurrentPlan = useMemo(() => {
    const plan = subscription?.planCode?.toLowerCase() ?? 'free';
    if (plan.includes('year')) return 'pro_yearly';
    if (plan.includes('pro')) return 'pro_monthly';
    return 'free';
  }, [subscription?.planCode]);

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
      <section className="space-y-6 sm:space-y-8">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.code === normalizedCurrentPlan;
            return (
              <Card
                className={`relative overflow-hidden border text-zinc-100 transition-colors ${
                  isCurrent
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-zinc-800 bg-zinc-900/60'
                }`}
                key={plan.code}
              >
                <CardHeader className="space-y-2 p-4 sm:p-6">
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-sm sm:text-base">{plan.title}</CardTitle>
                    {plan.badge ? (
                      <Badge
                        className="bg-violet-500/20 text-[11px] text-violet-200 sm:text-xs"
                        variant="secondary"
                      >
                        {plan.badge}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-end gap-1">
                    <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {plan.price}
                    </p>
                    <p className="pb-0.5 text-xs text-muted-foreground sm:pb-1 sm:text-sm">
                      {plan.period}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                  <ul className="space-y-1.5 text-sm text-zinc-300">
                    {plan.highlights.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                  <Button
                    className="w-full rounded-full transition-transform hover:-translate-y-0.5"
                    onClick={openCheckoutPlaceholder}
                    type="button"
                    variant={isCurrent ? 'outline' : 'default'}
                  >
                    {isCurrent ? 'Current plan' : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Card className="border-zinc-800 bg-zinc-900/50 text-zinc-100">
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
                  <div className="space-y-1 text-sm text-zinc-300">
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
                      onClick={openCheckoutPlaceholder}
                      type="button"
                    >
                      Manage subscription
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

          <Card className="border-zinc-800 bg-zinc-900/50 text-zinc-100">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Usage snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-sm text-zinc-400">
                Billing usage meters (tokens, uploads, and workspace limits) are part of the next
                billing increment.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-400">
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
          className="mt-4 rounded-md border border-emerald-600/30 bg-emerald-600/10 p-3 text-sm text-emerald-700"
          role="status"
        >
          {notice}
        </div>
      ) : null}
    </AppShell>
  );
}
