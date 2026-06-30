'use client';

import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type PlanCode, pricingPlans } from '@/lib/pricing-plans';

type PricingSectionProps = {
  mode?: 'landing' | 'billing';
  currentPlanCode?: PlanCode;
  onSelectPlan?: (code: PlanCode) => void;
  showHeader?: boolean;
};

function badgeClassName(badge: string | undefined) {
  if (badge === 'Free') {
    return 'w-fit border-zinc-600 bg-zinc-800 text-zinc-200';
  }
  if (badge === 'Teams') {
    return 'w-fit border-zinc-600 bg-zinc-800 text-zinc-300';
  }
  return 'w-fit border-zinc-500 bg-zinc-800 text-zinc-100';
}

export function PricingSection({
  mode = 'landing',
  currentPlanCode = 'free',
  onSelectPlan,
  showHeader = true,
}: PricingSectionProps) {
  return (
    <section
      className={mode === 'landing' ? 'scroll-mt-24' : undefined}
      id={mode === 'landing' ? 'pricing' : undefined}
    >
      {showHeader ? (
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl md:text-4xl">
            Simple pricing, no surprises.
          </h2>
          <Badge className="mt-4 border-zinc-600 bg-zinc-800 text-zinc-200" variant="outline">
            <Sparkles className="mr-1 h-3 w-3" />
            Start free, no credit card required
          </Badge>
          <p className="mt-3 text-sm text-zinc-400">
            Upgrade anytime. You only pay if you choose Pro or Teams.
          </p>
        </div>
      ) : null}

      <div className={`grid gap-4 sm:grid-cols-2 ${showHeader ? 'mt-8' : ''} xl:grid-cols-4`}>
        {pricingPlans.map((plan) => {
          const isCurrent = mode === 'billing' && plan.code === currentPlanCode;
          const isHighlighted = plan.highlighted || isCurrent;

          return (
            <Card
              className={`relative flex flex-col border text-zinc-100 transition-colors ${
                isCurrent
                  ? 'border-zinc-400/50 bg-zinc-800/40'
                  : isHighlighted
                    ? 'border-zinc-500/50 bg-zinc-900/80'
                    : 'border-zinc-800 bg-zinc-900/60'
              }`}
              key={plan.code}
            >
              <CardHeader className="space-y-3 p-4 sm:p-5">
                {plan.badge ? (
                  <Badge className={badgeClassName(plan.badge)} variant="secondary">
                    {plan.badge}
                  </Badge>
                ) : null}
                <CardTitle className="text-xs tracking-wider sm:text-sm">{plan.title}</CardTitle>
                <div className="flex items-end gap-1">
                  <p className="text-2xl font-semibold sm:text-3xl">{plan.price}</p>
                  <p className="pb-0.5 text-xs text-zinc-400 sm:pb-1 sm:text-sm">{plan.period}</p>
                </div>
                {plan.subPrice ? (
                  <p className="text-[11px] leading-snug text-zinc-500 sm:text-xs">
                    {plan.subPrice}
                  </p>
                ) : null}
                <p className="text-xs leading-relaxed text-zinc-400 sm:text-sm">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-4 pt-0 sm:p-5 sm:pt-0">
                <ul className="flex-1 space-y-2 text-xs text-zinc-300 sm:text-sm">
                  {plan.features.map((feature) => (
                    <li className="flex items-start gap-2" key={feature}>
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-300 sm:h-4 sm:w-4" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {mode === 'landing' ? (
                  <Button
                    asChild
                    className={`mt-5 w-full rounded-full sm:mt-6 ${
                      plan.highlighted || plan.code === 'free'
                        ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                        : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                    }`}
                  >
                    <Link href="/sign-up">{plan.cta}</Link>
                  </Button>
                ) : (
                  <Button
                    className="mt-5 w-full rounded-full transition-transform hover:-translate-y-0.5 sm:mt-6"
                    onClick={() => onSelectPlan?.(plan.code)}
                    type="button"
                    variant={isCurrent ? 'outline' : plan.highlighted ? 'default' : 'secondary'}
                  >
                    {isCurrent ? 'Current plan' : plan.cta}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {mode === 'landing' ? (
        <p className="mt-4 text-center text-xs text-zinc-500">
          Create your account to start free. Upgrade to Pro or Teams anytime from billing.
        </p>
      ) : (
        <p className="mt-4 text-center text-xs text-zinc-500">
          Checkout integration is next. Plan selection confirms billing visibility and state.
        </p>
      )}
    </section>
  );
}
