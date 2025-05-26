
import { supabase } from '@/integrations/supabase/client';

export async function canSubmitWorkOrders(equipmentId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return false;
    }

    // First try checking via organization membership
    const { data: orgData, error: orgError } = await supabase
      .from('equipment')
      .select(`
        id,
        org_id,
        user_roles!inner(role)
      `)
      .eq('id', equipmentId)
      .eq('user_roles.user_id', user.user.id)
      .maybeSingle();

    if (!orgError && orgData?.user_roles) {
      const orgRole = Array.isArray(orgData.user_roles) 
        ? orgData.user_roles[0]?.role 
        : orgData.user_roles.role;
      
      if (['owner', 'manager', 'technician'].includes(orgRole)) {
        return true;
      }
    }

    // If org check failed, try team membership
    const { data: equipmentData } = await supabase
      .from('equipment')
      .select('team_id')
      .eq('id', equipmentId)
      .single();

    if (!equipmentData?.team_id) {
      return false;
    }

    // Check team membership separately
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user.user.id)
      .single();

    if (!appUser) {
      return false;
    }

    const { data: teamMember } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('team_id', equipmentData.team_id)
      .maybeSingle();

    if (!teamMember) {
      return false;
    }

    const { data: teamRole } = await supabase
      .from('team_roles')
      .select('role')
      .eq('team_member_id', teamMember.id)
      .maybeSingle();

    if (teamRole?.role) {
      return ['manager', 'owner', 'admin', 'technician', 'requestor'].includes(teamRole.role);
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

    // First try checking via organization membership
    const { data: orgData, error: orgError } = await supabase
      .from('equipment')
      .select(`
        id,
        org_id,
        user_roles!inner(role)
      `)
      .eq('id', equipmentId)
      .eq('user_roles.user_id', user.user.id)
      .maybeSingle();

    if (!orgError && orgData?.user_roles) {
      const orgRole = Array.isArray(orgData.user_roles) 
        ? orgData.user_roles[0]?.role 
        : orgData.user_roles.role;
      
      if (['owner', 'manager'].includes(orgRole)) {
        return true;
      }
    }

    // If org check failed, try team membership
    const { data: equipmentData } = await supabase
      .from('equipment')
      .select('team_id')
      .eq('id', equipmentId)
      .single();

    if (!equipmentData?.team_id) {
      return false;
    }

    // Check team membership separately
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user.user.id)
      .single();

    if (!appUser) {
      return false;
    }

    const { data: teamMember } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('team_id', equipmentData.team_id)
      .maybeSingle();

    if (!teamMember) {
      return false;
    }

    const { data: teamRole } = await supabase
      .from('team_roles')
      .select('role')
      .eq('team_member_id', teamMember.id)
      .maybeSingle();

    if (teamRole?.role) {
      return ['manager', 'owner', 'admin'].includes(teamRole.role);
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

    // First try checking via organization membership
    const { data: orgData, error: orgError } = await supabase
      .from('equipment')
      .select(`
        id,
        org_id,
        user_roles!inner(role)
      `)
      .eq('id', equipmentId)
      .eq('user_roles.user_id', user.user.id)
      .maybeSingle();

    if (!orgError && orgData) {
      return true; // Any org member can view
    }

    // If org check failed, try team membership
    const { data: equipmentData } = await supabase
      .from('equipment')
      .select('team_id')
      .eq('id', equipmentId)
      .single();

    if (!equipmentData?.team_id) {
      return false;
    }

    // Check team membership separately
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user.user.id)
      .single();

    if (!appUser) {
      return false;
    }

    const { data: teamMember } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('team_id', equipmentData.team_id)
      .maybeSingle();

    if (!teamMember) {
      return false;
    }

    const { data: teamRole } = await supabase
      .from('team_roles')
      .select('role')
      .eq('team_member_id', teamMember.id)
      .maybeSingle();

    if (teamRole?.role) {
      return ['manager', 'owner', 'admin', 'technician', 'requestor', 'viewer'].includes(teamRole.role);
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
