import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type BillingEventRecord = {
  workspaceId: string | null;
  provider: string;
  eventType: string;
  status: string;
  message: string;
  externalEventId?: string | null;
};

export async function appendBillingEvent(record: BillingEventRecord): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from('billing_events').insert({
    workspace_id: record.workspaceId,
    provider: record.provider,
    event_type: record.eventType,
    status: record.status,
    message: record.message,
    external_event_id: record.externalEventId ?? null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to append billing event', error);
  }
}
