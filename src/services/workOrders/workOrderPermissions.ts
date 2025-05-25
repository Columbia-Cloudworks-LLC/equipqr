
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if user can submit work orders for equipment
 */
export async function canSubmitWorkOrders(equipmentId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase.rpc('can_submit_work_orders', {
      p_user_id: user.user.id,
      p_equipment_id: equipmentId
    });

    if (error) {
      console.error('Error checking work order submission permission:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in canSubmitWorkOrders:', error);
    return false;
  }
}

/**
 * Check if user can manage work orders for equipment
 */
export async function canManageWorkOrders(equipmentId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase.rpc('can_manage_work_orders', {
      p_user_id: user.user.id,
      p_equipment_id: equipmentId
    });

    if (error) {
      console.error('Error checking work order management permission:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in canManageWorkOrders:', error);
    return false;
  }
}

/**
 * Check if user can view work order hours (not requestors)
 */
export async function canViewWorkOrderHours(equipmentId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    // Get user's role for this equipment
    const { data: equipment } = await supabase
      .from('equipment')
      .select('org_id, team_id')
      .eq('id', equipmentId)
      .single();

    if (!equipment) return false;

    // Get user's app_user ID
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user.user.id)
      .single();

    if (!appUser) return false;

    // Check org role first
    const { data: orgRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id)
      .eq('org_id', equipment.org_id)
      .single();

    if (orgRole && ['owner', 'manager', 'technician'].includes(orgRole.role)) {
      return true;
    }

    // Check team role if equipment is assigned to a team
    if (equipment.team_id) {
      const { data: teamMember } = await supabase
        .from('team_member')
        .select(`
          team_roles!inner(role)
        `)
        .eq('user_id', appUser.id)
        .eq('team_id', equipment.team_id)
        .single();

      if (teamMember?.team_roles && Array.isArray(teamMember.team_roles) && teamMember.team_roles.length > 0) {
        const role = teamMember.team_roles[0].role;
        if (['manager', 'technician'].includes(role)) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error in canViewWorkOrderHours:', error);
    return false;
  }
}
