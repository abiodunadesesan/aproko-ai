export type PlanCode = 'free' | 'teams' | 'pro_monthly' | 'pro_yearly';

export type PricingPlan = {
  code: PlanCode;
  badge?: string;
  title: string;
  price: string;
  period: string;
  subPrice?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

export const pricingPlans: PricingPlan[] = [
  {
    code: 'free',
    badge: 'Free',
    title: 'FREE',
    price: '$0',
    period: '/forever',
    description: 'Start instantly. No credit card required.',
    features: [
      '100 AI queries included',
      'Core library & memory',
      'Basic search',
      'Flashcards & quizzes',
      'Upgrade anytime',
    ],
    cta: 'Start free',
  },
  {
    code: 'teams',
    badge: 'Teams',
    title: 'TEAMS',
    price: '$12',
    period: '/mo',
    description: 'Shared knowledge workspaces for small groups.',
    features: [
      'Shared library & memory',
      '500 AI queries / seat',
      'Workspace admin controls',
      'Collaborative research',
      'Flashcards & quizzes',
      'Syncs across web clients',
    ],
    cta: 'Upgrade to Teams',
  },
  {
    code: 'pro_monthly',
    title: 'PRO (MONTHLY)',
    price: '$20',
    period: '/mo',
    subPrice: 'or $160/yr (≈ $13.33/mo)',
    description: 'Unlimited everything. All features included.',
    features: [
      'Unlimited AI queries',
      'Advanced memory timeline',
      'Research workspace',
      'Priority model routing',
      'Flashcards & quizzes',
      'Long-term memory',
    ],
    cta: 'Upgrade monthly',
  },
  {
    code: 'pro_yearly',
    badge: 'Best value',
    title: 'PRO (YEARLY)',
    price: '$160',
    period: '/yr',
    subPrice: '≈ $13.33/mo • Save $80/yr vs monthly',
    description: 'Unlimited everything. All features included.',
    features: [
      'All Pro features',
      'Lower annual cost',
      'Priority support',
      'Long-term memory',
      'Research workspace',
      'Team-ready foundation',
    ],
    cta: 'Upgrade yearly',
    highlighted: true,
  },
];

export function normalizePlanCode(planCode: string | undefined | null): PlanCode {
  const plan = planCode?.toLowerCase() ?? 'free';
  if (plan.includes('team')) return 'teams';
  if (plan.includes('year')) return 'pro_yearly';
  if (plan.includes('pro')) return 'pro_monthly';
  return 'free';
}
