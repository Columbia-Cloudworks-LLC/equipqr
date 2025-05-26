
import { supabase } from '@/integrations/supabase/client';

export interface AssignableTeamMember {
  user_id: string;
  app_user_id: string;
  display_name: string;
  email: string;
  role: string;
}

export async function getAssignableTeamMembers(equipmentId: string): Promise<AssignableTeamMember[]> {
  try {
    const { data, error } = await supabase.rpc('get_assignable_team_members', {
      p_equipment_id: equipmentId
    });

    if (error) {
      console.error('Error fetching assignable team members:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAssignableTeamMembers:', error);
    throw error;
  }
}

export async function sendAssignmentNotification(
  userId: string,
  workOrderId: string,
  workOrderTitle: string,
  equipmentName: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('send_assignment_notification', {
      p_user_id: userId,
      p_work_order_id: workOrderId,
      p_work_order_title: workOrderTitle,
      p_equipment_name: equipmentName
    });

    if (error) {
      console.error('Error sending assignment notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in sendAssignmentNotification:', error);
    throw error;
  }
}
