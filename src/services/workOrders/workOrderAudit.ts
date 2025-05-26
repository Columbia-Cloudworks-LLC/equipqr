
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

    const { error } = await supabase
      .from('work_order_audit_log')
      .insert({
        work_order_id: workOrderId,
        change_type: changeType,
        old_value: oldValue,
        new_value: newValue,
        changed_by: user.user.id // Use auth.uid() for consistency
      });

    if (error) {
      console.error('Error logging work order change:', error);
    }
  } catch (error) {
    console.error('Error in logWorkOrderChange:', error);
  }
}
