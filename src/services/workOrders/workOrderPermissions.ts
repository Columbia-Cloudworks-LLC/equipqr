
import { supabase } from '@/integrations/supabase/client';

export async function canSubmitWorkOrders(equipmentId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return false;
    }

    // Use direct SQL query instead of RPC to avoid type issues
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        id,
        org_id,
        team_id,
        user_roles!inner(role),
        team_member!left(
          id,
          team_roles!left(role)
        )
      `)
      .eq('id', equipmentId)
      .eq('user_roles.user_id', user.user.id)
      .single();

    if (error) {
      console.error('Error checking work order submission permission:', error);
      
      // Fallback: try checking via team membership
      const { data: teamData, error: teamError } = await supabase
        .from('equipment')
        .select(`
          id,
          team_id,
          team!inner(
            id,
            team_member!inner(
              id,
              app_user!inner(auth_uid),
              team_roles(role)
            )
          )
        `)
        .eq('id', equipmentId)
        .eq('team.team_member.app_user.auth_uid', user.user.id)
        .maybeSingle();

      if (teamError || !teamData) {
        return false;
      }

      // Check if user has submission permissions through team role
      const teamRole = teamData.team?.team_member?.[0]?.team_roles?.[0]?.role;
      return ['manager', 'owner', 'admin', 'technician', 'requestor'].includes(teamRole);
    }

    // Check if user has org-level permissions for submission
    const orgRole = data.user_roles?.[0]?.role;
    return ['owner', 'manager', 'technician'].includes(orgRole);
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

    // Use direct SQL query instead of RPC to avoid type issues
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        id,
        org_id,
        team_id,
        user_roles!inner(role),
        team_member!left(
          id,
          team_roles!left(role)
        )
      `)
      .eq('id', equipmentId)
      .eq('user_roles.user_id', user.user.id)
      .single();

    if (error) {
      console.error('Error checking work order management permission:', error);
      
      // Fallback: try checking via team membership
      const { data: teamData, error: teamError } = await supabase
        .from('equipment')
        .select(`
          id,
          team_id,
          team!inner(
            id,
            team_member!inner(
              id,
              app_user!inner(auth_uid),
              team_roles(role)
            )
          )
        `)
        .eq('id', equipmentId)
        .eq('team.team_member.app_user.auth_uid', user.user.id)
        .maybeSingle();

      if (teamError || !teamData) {
        return false;
      }

      // Check if user has management permissions through team role
      const teamRole = teamData.team?.team_member?.[0]?.team_roles?.[0]?.role;
      return ['manager', 'owner', 'admin'].includes(teamRole);
    }

    // Check if user has org-level permissions for management
    const orgRole = data.user_roles?.[0]?.role;
    return ['owner', 'manager'].includes(orgRole);
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

    // Use direct SQL query instead of RPC to avoid type issues
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        id,
        org_id,
        team_id,
        user_roles!inner(role),
        team_member!left(
          id,
          team_roles!left(role)
        )
      `)
      .eq('id', equipmentId)
      .eq('user_roles.user_id', user.user.id)
      .single();

    if (error) {
      console.error('Error checking work order viewing permission:', error);
      
      // Fallback: try checking via team membership
      const { data: teamData, error: teamError } = await supabase
        .from('equipment')
        .select(`
          id,
          team_id,
          team!inner(
            id,
            team_member!inner(
              id,
              app_user!inner(auth_uid),
              team_roles(role)
            )
          )
        `)
        .eq('id', equipmentId)
        .eq('team.team_member.app_user.auth_uid', user.user.id)
        .maybeSingle();

      if (teamError || !teamData) {
        return false;
      }

      // Check if user has viewing permissions through team role
      const teamRole = teamData.team?.team_member?.[0]?.team_roles?.[0]?.role;
      return ['manager', 'owner', 'admin', 'technician', 'requestor', 'viewer'].includes(teamRole);
    }

    return data !== null;
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
