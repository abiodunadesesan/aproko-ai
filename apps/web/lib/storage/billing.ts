import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type BillingSubscription = {
  workspaceId: string;
  planCode: string;
  status: string;
  provider: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

type DbSubscriptionRow = {
  workspace_id: string;
  plan_code: string | null;
  status: string | null;
  provider: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  updated_at: string | null;
};

const DEFAULT_SUBSCRIPTION: BillingSubscription = {
  workspaceId: 'default-workspace',
  planCode: 'free',
  status: 'active',
  provider: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

function toBillingSubscription(row: DbSubscriptionRow): BillingSubscription {
  return {
    workspaceId: row.workspace_id,
    planCode: row.plan_code ?? 'free',
    status: row.status ?? 'active',
    provider: row.provider,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
  };
}

export async function getBillingSubscription(workspaceId: string): Promise<BillingSubscription> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { ...DEFAULT_SUBSCRIPTION, workspaceId };
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      'workspace_id, plan_code, status, provider, current_period_start, current_period_end, cancel_at_period_end, updated_at',
    )
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { ...DEFAULT_SUBSCRIPTION, workspaceId };
  }

  return toBillingSubscription(data as DbSubscriptionRow);
}
