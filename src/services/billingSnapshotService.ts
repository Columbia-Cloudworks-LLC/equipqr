import { supabase } from '@/integrations/supabase/client';
import { showErrorToast } from '@/utils/errorHandling';

export interface BillingSnapshot {
  organization: {
    id: string;
    name: string;
    plan: string;
    billing_cycle?: string;
    member_count: number;
    billable_members: number;
    storage_used_mb: number;
    fleet_map_enabled: boolean;
    next_billing_date?: string;
    features: string[];
  };
  slots: {
    total_purchased: number;
    used_slots: number;
    available_slots: number;
    exempted_slots: number;
    current_period_start?: string;
    current_period_end?: string;
    slot_type: string;
  }[];
  subscriptions: {
    id: string;
    feature_type: string;
    status: string;
    quantity: number;
    unit_price_cents: number;
    billing_cycle: string;
    current_period_start?: string;
    current_period_end?: string;
    stripe_subscription_id?: string;
  }[];
  usage: {
    usage_type: string;
    usage_value: number;
    billing_period_start: string;
    billing_period_end: string;
  }[];
  exemptions: {
    exemption_type: string;
    exemption_value: number;
    reason?: string;
    expires_at?: string;
  }[];
    events: {
      event_type: string;
      amount_change: number;
      effective_date: string;
      event_data: Record<string, unknown>;
    }[];
}

export const getBillingSnapshot = async (organizationId: string): Promise<BillingSnapshot> => {
  try {
    // Get organization data
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id, name, plan, billing_cycle, member_count, billable_members, 
        storage_used_mb, fleet_map_enabled, next_billing_date, features
      `)
      .eq('id', organizationId)
      .maybeSingle();

    if (orgError) {
      showErrorToast(orgError, 'Failed to fetch organization');
      throw orgError;
    }

    if (!orgData) {
      throw new Error('Organization not found');
    }

    // Get current slot availability (using the function)
    const { data: slotsData, error: slotsError } = await supabase
      .rpc('get_organization_slot_availability_with_exemptions', { org_id: organizationId });

    if (slotsError) {
      showErrorToast(slotsError, 'Failed to fetch slot availability');
      throw slotsError;
    }

    // Get organization subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('organization_subscriptions')
      .select(`
        id, feature_type, status, quantity, unit_price_cents, billing_cycle,
        current_period_start, current_period_end, stripe_subscription_id
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (subscriptionsError) {
      showErrorToast(subscriptionsError, 'Failed to fetch subscriptions');
      throw subscriptionsError;
    }

    // Get current billing period usage
    const { data: usage, error: usageError } = await supabase
      .from('billing_usage')
      .select('usage_type, usage_value, billing_period_start, billing_period_end')
      .eq('organization_id', organizationId)
      .gte('billing_period_end', new Date().toISOString())
      .order('billing_period_start', { ascending: false });

    if (usageError) {
      showErrorToast(usageError, 'Failed to fetch billing usage');
      throw usageError;
    }

    // Get active exemptions
    const { data: exemptions, error: exemptionsError } = await supabase
      .from('billing_exemptions')
      .select('exemption_type, exemption_value, reason, expires_at')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    if (exemptionsError) {
      showErrorToast(exemptionsError, 'Failed to fetch exemptions');
      throw exemptionsError;
    }

    // Get recent billing events (last 10)
    const { data: events, error: eventsError } = await supabase
      .from('billing_events')
      .select('event_type, amount_change, effective_date, event_data')
      .eq('organization_id', organizationId)
      .order('effective_date', { ascending: false })
      .limit(10);

    if (eventsError) {
      showErrorToast(eventsError, 'Failed to fetch billing events');
      throw eventsError;
    }

    // Format slots data
    const slots = slotsData && slotsData.length > 0 ? [{
      total_purchased: slotsData[0].total_purchased || 0,
      used_slots: slotsData[0].used_slots || 0,
      available_slots: slotsData[0].available_slots || 0,
      exempted_slots: slotsData[0].exempted_slots || 0,
      current_period_start: slotsData[0].current_period_start,
      current_period_end: slotsData[0].current_period_end,
      slot_type: 'user_license'
    }] : [];

    return {
      organization: orgData,
      slots,
      subscriptions: subscriptions || [],
      usage: usage || [],
      exemptions: exemptions || [],
      events: events || []
    };
  } catch (error) {
    console.error('Error fetching billing snapshot:', error);
    throw error;
  }
};