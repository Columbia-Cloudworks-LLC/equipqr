
import { supabase } from '@/integrations/supabase/client';

export async function canViewWorkOrders(equipmentId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return false;
    }

    const { data, error } = await supabase.rpc('can_view_work_orders', {
      p_user_id: user.user.id, // Use auth.uid()
      p_equipment_id: equipmentId
    });

    if (error) {
      console.error('Error checking work order viewing permission:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in canViewWorkOrders:', error);
    return false;
  }
}
