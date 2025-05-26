
import { supabase } from '@/integrations/supabase/client';

export type WorkOrderUserRole = 'manager' | 'technician' | 'requestor' | 'viewer' | 'none';

export async function getUserRoleForWorkOrder(equipmentId: string): Promise<WorkOrderUserRole> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return 'none';
    }

    // Get equipment details first
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, org_id, team_id')
      .eq('id', equipmentId)
      .single();

    if (equipmentError || !equipment) {
      console.error('Error fetching equipment:', equipmentError);
      return 'none';
    }

    // Check organization membership first
    const { data: orgRole, error: orgError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id)
      .eq('org_id', equipment.org_id)
      .maybeSingle();

    if (!orgError && orgRole?.role) {
      if (orgRole.role === 'owner' || orgRole.role === 'manager') {
        return 'manager';
      }
      if (orgRole.role === 'technician') {
        return 'technician';
      }
    }

    // If equipment has a team, check team membership
    if (equipment.team_id) {
      // Get app_user ID
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', user.user.id)
        .single();

      if (!appUser) {
        return 'none';
      }

      // Check team membership
      const { data: teamMember } = await supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', equipment.team_id)
        .maybeSingle();

      if (!teamMember) {
        return 'none';
      }

      // Check team role
      const { data: teamRole } = await supabase
        .from('team_roles')
        .select('role')
        .eq('team_member_id', teamMember.id)
        .maybeSingle();

      if (teamRole?.role) {
        if (['manager', 'owner', 'admin'].includes(teamRole.role)) {
          return 'manager';
        }
        if (teamRole.role === 'technician') {
          return 'technician';
        }
        if (teamRole.role === 'requestor') {
          return 'requestor';
        }
        if (teamRole.role === 'viewer') {
          return 'viewer';
        }
      }
    }

    return 'none';
  } catch (error) {
    console.error('Error getting user role for work order:', error);
    return 'none';
  }
}
