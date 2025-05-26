
import { supabase } from '@/integrations/supabase/client';

export async function logWorkOrderChange(
  workOrderId: string,
  changeType: 'status_change' | 'assignee_change' | 'field_update',
  oldValue: any,
  newValue: any
) {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.warn('No authenticated user for audit log');
      return;
    }

    // Get app_user.id from auth.uid for audit logging
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user.user.id)
      .single();

    if (appUserError || !appUser) {
      console.error('Error fetching app_user for audit:', appUserError);
      return;
    }

    const { error } = await supabase
      .from('work_order_audit_log')
      .insert({
        work_order_id: workOrderId,
        change_type: changeType,
        old_value: oldValue,
        new_value: newValue,
        changed_by: appUser.id // Use app_user.id for consistency
      });

    if (error) {
      console.error('Error logging work order change:', error);
    }
  } catch (error) {
    console.error('Error in logWorkOrderChange:', error);
  }
}
