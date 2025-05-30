
import { supabase } from '@/integrations/supabase/client';

export interface BillingContext {
  billing_required: boolean;
  billable_users_count: number;
  has_equipment: boolean;
  grace_period_active: boolean;
  grace_period_end?: string;
  monthly_cost_per_user: number;
}

export interface InvitationBillingImpact {
  will_be_charged: boolean;
  cost_per_invitation: number;
  total_monthly_increase: number;
  grace_period_applies: boolean;
  message: string;
}

/**
 * Get billing context for the current organization
 */
export async function getBillingContext(orgId: string): Promise<BillingContext> {
  try {
    const { data, error } = await supabase.functions.invoke('get_billing_context', {
      body: { org_id: orgId }
    });

    if (error) {
      console.error('Error fetching billing context:', error);
      throw error;
    }

    return data || {
      billing_required: false,
      billable_users_count: 0,
      has_equipment: false,
      grace_period_active: false,
      monthly_cost_per_user: 10
    };
  } catch (error) {
    console.error('Error in getBillingContext:', error);
    throw error;
  }
}

/**
 * Calculate billing impact of sending invitations
 */
export function calculateInvitationImpact(
  billingContext: BillingContext,
  invitationCount: number,
  invitedRoles: string[]
): InvitationBillingImpact {
  // Only non-viewer roles are billable
  const billableInvitations = invitedRoles.filter(role => role !== 'viewer').length;
  
  const costPerInvitation = billingContext.monthly_cost_per_user;
  const totalMonthlyIncrease = billableInvitations * costPerInvitation;
  
  // Determine if charges will apply
  const willBeCharged = billingContext.billing_required && billableInvitations > 0;
  
  // Check if grace period applies
  const gracePeriodApplies = billingContext.has_equipment && billingContext.grace_period_active;
  
  let message = '';
  
  if (billableInvitations === 0) {
    message = 'Viewer invitations are free and will not incur charges.';
  } else if (!billingContext.has_equipment) {
    message = `Adding ${billableInvitations} member(s) will activate billing when equipment is first added. Cost: $${totalMonthlyIncrease}/month.`;
  } else if (gracePeriodApplies) {
    message = `Adding ${billableInvitations} member(s) will cost $${totalMonthlyIncrease}/month after your grace period ends.`;
  } else if (willBeCharged) {
    message = `Adding ${billableInvitations} member(s) will increase your monthly bill by $${totalMonthlyIncrease}.`;
  } else {
    message = 'No additional charges will apply for these invitations.';
  }
  
  return {
    will_be_charged: willBeCharged,
    cost_per_invitation: costPerInvitation,
    total_monthly_increase: totalMonthlyIncrease,
    grace_period_applies: gracePeriodApplies,
    message
  };
}
