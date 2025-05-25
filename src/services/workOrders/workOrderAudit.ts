
import { supabase } from '@/integrations/supabase/client';
import { WorkOrderAuditLog } from '@/types/workOrders';

/**
 * Log a work order change for audit purposes
 */
export async function logWorkOrderChange(
  workOrderId: string,
  changeType: 'status_change' | 'assignee_change' | 'field_update',
  oldValue: any,
  newValue: any
): Promise<void> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Get app_user ID
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user.user.id)
      .single();

    if (appUserError || !appUser) {
      console.error('Error getting app user for audit log:', appUserError);
      return;
    }

    const { error } = await supabase
      .from('work_order_audit_log')
      .insert({
        work_order_id: workOrderId,
        changed_by: appUser.id,
        change_type: changeType,
        old_value: oldValue,
        new_value: newValue
      });

    if (error) {
      console.error('Error logging work order change:', error);
    }
  } catch (error) {
    console.error('Error in logWorkOrderChange:', error);
  }
}

/**
 * Get audit log for a work order
 */
export async function getWorkOrderAuditLog(workOrderId: string): Promise<WorkOrderAuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('work_order_audit_log')
      .select(`
        *,
        changed_by_profile:app_user!work_order_audit_log_changed_by_fkey(
          user_profiles!inner(display_name, email)
        )
      `)
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching work order audit log:', error);
      throw error;
    }

    return data?.map(log => ({
      ...log,
      changed_by_name: log.changed_by_profile?.user_profiles?.display_name || log.changed_by_profile?.user_profiles?.email
    })) || [];
  } catch (error) {
    console.error('Error in getWorkOrderAuditLog:', error);
    throw error;
  }
}
