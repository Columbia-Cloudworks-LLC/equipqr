
import { supabase } from '@/integrations/supabase/client';

export async function canSubmitWorkOrders(equipmentId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return false;
    }

    // Get equipment details first
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, org_id, team_id')
      .eq('id', equipmentId)
      .single();

    if (equipmentError || !equipment) {
      console.error('Error fetching equipment:', equipmentError);
      return false;
    }

    // Check organization membership separately
    const { data: orgRole, error: orgError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id)
      .eq('org_id', equipment.org_id)
      .maybeSingle();

    if (!orgError && orgRole?.role) {
      if (['owner', 'manager', 'technician'].includes(orgRole.role)) {
        return true;
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
        return false;
      }

      // Check team membership
      const { data: teamMember } = await supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', equipment.team_id)
        .maybeSingle();

      if (!teamMember) {
        return false;
      }

      // Check team role
      const { data: teamRole } = await supabase
        .from('team_roles')
        .select('role')
        .eq('team_member_id', teamMember.id)
        .maybeSingle();

      if (teamRole?.role) {
        return ['manager', 'owner', 'admin', 'technician', 'requestor'].includes(teamRole.role);
      }
    }

    return false;
  } catch (error) {
    console.error('Error in canSubmitWorkOrders:', error);
    return false;
  }
}

export async function canManageWorkOrders(equipmentId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return false;
    }

    // Get equipment details first
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, org_id, team_id')
      .eq('id', equipmentId)
      .single();

    if (equipmentError || !equipment) {
      console.error('Error fetching equipment:', equipmentError);
      return false;
    }

    // Check organization membership separately
    const { data: orgRole, error: orgError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id)
      .eq('org_id', equipment.org_id)
      .maybeSingle();

    if (!orgError && orgRole?.role) {
      if (['owner', 'manager'].includes(orgRole.role)) {
        return true;
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
        return false;
      }

      // Check team membership
      const { data: teamMember } = await supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', equipment.team_id)
        .maybeSingle();

      if (!teamMember) {
        return false;
      }

      // Check team role
      const { data: teamRole } = await supabase
        .from('team_roles')
        .select('role')
        .eq('team_member_id', teamMember.id)
        .maybeSingle();

      if (teamRole?.role) {
        return ['manager', 'owner', 'admin'].includes(teamRole.role);
      }
    }

    return false;
  } catch (error) {
    console.error('Error in canManageWorkOrders:', error);
    return false;
  }
}

export async function canViewWorkOrders(equipmentId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return false;
    }

    // Get equipment details first
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, org_id, team_id')
      .eq('id', equipmentId)
      .single();

    if (equipmentError || !equipment) {
      console.error('Error fetching equipment:', equipmentError);
      return false;
    }

    // Check organization membership separately - any org member can view
    const { data: orgRole, error: orgError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id)
      .eq('org_id', equipment.org_id)
      .maybeSingle();

    if (!orgError && orgRole?.role) {
      return true; // Any org member can view
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
        return false;
      }

      // Check team membership
      const { data: teamMember } = await supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', equipment.team_id)
        .maybeSingle();

      if (!teamMember) {
        return false;
      }

      // Check team role
      const { data: teamRole } = await supabase
        .from('team_roles')
        .select('role')
        .eq('team_member_id', teamMember.id)
        .maybeSingle();

      if (teamRole?.role) {
        return ['manager', 'owner', 'admin', 'technician', 'requestor', 'viewer'].includes(teamRole.role);
      }
    }

    return false;
  } catch (error) {
    console.error('Error in canViewWorkOrders:', error);
    return false;
  }
}

export async function canViewWorkOrderHours(equipmentId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return false;
    }

    // For now, same permission as managing work orders
    return canManageWorkOrders(equipmentId);
  } catch (error) {
    console.error('Error in canViewWorkOrderHours:', error);
    return false;
  }
}
