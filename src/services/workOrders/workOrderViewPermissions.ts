
import { supabase } from '@/integrations/supabase/client';

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
      
      // Fallback: try checking via team membership if direct org access fails
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
