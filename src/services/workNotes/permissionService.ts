
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if the current user can edit work notes
 */
export async function canManageWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    // Get the equipment details including team_id
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('team_id, org_id')
      .eq('id', equipmentId)
      .single();

    if (equipmentError) {
      console.error('Error fetching equipment details:', equipmentError);
      return false;
    }

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) {
      return false;
    }

    const userId = sessionData.session.user.id;

    // Check if user is org owner/manager
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', equipment.org_id);

    if (!rolesError && userRoles?.some(ur => ['owner', 'manager'].includes(ur.role))) {
      return true;
    }

    // If it's a team equipment, check team role
    if (equipment.team_id) {
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();

      if (appUser) {
        const { data: teamMember } = await supabase
          .from('team_member')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('team_id', equipment.team_id)
          .single();

        if (teamMember) {
          const { data: teamRoles } = await supabase
            .from('team_roles')
            .select('role')
            .eq('team_member_id', teamMember.id);

          if (teamRoles?.some(tr => tr.role === 'manager')) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking work note permissions:', error);
    return false;
  }
}

/**
 * Check if the current user can create work notes (managers and technicians)
 */
export async function canCreateWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    // Get the equipment details including team_id
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('team_id, org_id')
      .eq('id', equipmentId)
      .single();

    if (equipmentError) {
      console.error('Error fetching equipment details:', equipmentError);
      return false;
    }

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) {
      return false;
    }

    const userId = sessionData.session.user.id;

    // Check if user is org owner/manager
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', equipment.org_id);

    if (!rolesError && userRoles?.some(ur => ['owner', 'manager'].includes(ur.role))) {
      return true;
    }

    // If it's a team equipment, check team role
    if (equipment.team_id) {
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();

      if (appUser) {
        const { data: teamMember } = await supabase
          .from('team_member')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('team_id', equipment.team_id)
          .single();

        if (teamMember) {
          const { data: teamRoles } = await supabase
            .from('team_roles')
            .select('role')
            .eq('team_member_id', teamMember.id);

          if (teamRoles?.some(tr => ['manager', 'technician'].includes(tr.role))) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking work note creation permissions:', error);
    return false;
  }
}
