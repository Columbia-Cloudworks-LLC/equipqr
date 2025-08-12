import { supabase } from '@/integrations/supabase/client';

export interface OptimizedTeam {
  id: string;
  name: string;
  description: string;
  organization_id: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface OptimizedTeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: string;
  joined_date: string;
  user_name?: string;
  user_email?: string;
}

// Get user's teams using idx_team_members_user_team
export const getUserTeamsOptimized = async (userId: string): Promise<OptimizedTeam[]> => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        teams!inner (
          id,
          name,
          description,
          organization_id,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Get member counts for each team
    const teamIds = data?.map(tm => tm.teams.id) || [];
    const { data: memberCounts } = await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds);

    const countsByTeam = (memberCounts || []).reduce((acc, member) => {
      acc[member.team_id] = (acc[member.team_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (data || []).map(tm => ({
      id: tm.teams.id,
      name: tm.teams.name,
      description: tm.teams.description,
      organization_id: tm.teams.organization_id,
      member_count: countsByTeam[tm.teams.id] || 0,
      created_at: tm.teams.created_at,
      updated_at: tm.teams.updated_at
    }));
  } catch (error) {
    console.error('Error fetching user teams:', error);
    return [];
  }
};

// Get team members using idx_team_members_team_id
export const getTeamMembersOptimized = async (teamId: string): Promise<OptimizedTeamMember[]> => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profiles!team_members_user_id_fkey (
          name,
          email
        )
      `)
      .eq('team_id', teamId)
      .order('joined_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(member => ({
      id: member.id,
      user_id: member.user_id,
      team_id: member.team_id,
      role: member.role,
      joined_date: member.joined_date,
      user_name: member.profiles?.name,
      user_email: member.profiles?.email
    }));
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
};

// Get teams by organization with member counts
export const getOrganizationTeamsOptimized = async (organizationId: string): Promise<OptimizedTeam[]> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members(count)
      `)
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      organization_id: team.organization_id,
      member_count: team.team_members?.[0]?.count || 0,
      created_at: team.created_at,
      updated_at: team.updated_at
    }));
  } catch (error) {
    console.error('Error fetching organization teams:', error);
    return [];
  }
};

// Get a single team by ID with member count
export const getTeamByIdOptimized = async (teamId: string): Promise<OptimizedTeam | null> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members(count)
      `)
      .eq('id', teamId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      organization_id: data.organization_id,
      member_count: data.team_members?.[0]?.count || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error fetching team by ID:', error);
    return null;
  }
};

// Check if user is team manager (uses idx_team_members_user_team)
export const isTeamManager = async (userId: string, teamId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .eq('role', 'manager')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking team manager status:', error);
    return false;
  }
};