import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Team = Database['public']['Tables']['teams']['Row'];
type TeamInsert = Database['public']['Tables']['teams']['Insert'];
type TeamUpdate = Database['public']['Tables']['teams']['Update'];
type TeamMember = Database['public']['Tables']['team_members']['Row'];
type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];

export interface TeamWithMembers extends Team {
  members: Array<TeamMember & {
    profiles: {
      name: string;
      email: string;
    } | null;
  }>;
  member_count: number;
}

// Create a new team
export const createTeam = async (teamData: TeamInsert): Promise<Team> => {
  const { data, error } = await supabase
    .from('teams')
    .insert(teamData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Create a team and automatically add creator as manager
export const createTeamWithCreator = async (
  teamData: TeamInsert, 
  creatorId: string
): Promise<TeamWithMembers> => {
  // Start a transaction-like operation
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert(teamData)
    .select()
    .single();

  if (teamError) throw teamError;

  // Add creator as manager
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: creatorId,
      role: 'manager'
    });

  if (memberError) {
    // If adding member fails, we should ideally rollback the team creation
    // For now, we'll throw the error and let the caller handle cleanup
    throw memberError;
  }

  // Return the team with the creator as a member
  const teamWithMembers: TeamWithMembers = {
    ...team,
    members: [{
      id: '', // This will be filled by the actual query
      team_id: team.id,
      user_id: creatorId,
      role: 'manager' as const,
      joined_date: new Date().toISOString(),
      profiles: null // This will be filled by actual query if needed
    }],
    member_count: 1
  };

  return teamWithMembers;
};

// Update an existing team
export const updateTeam = async (id: string, updates: TeamUpdate): Promise<Team> => {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a team
export const deleteTeam = async (id: string): Promise<void> => {
  const { error, count } = await supabase
    .from('teams')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) throw error;
  
  // Check if the team was actually deleted
  if (count === 0) {
    throw new Error('Team could not be deleted. You may not have permission to delete this team.');
  }
};

// Get teams by organization with member details
export const getTeamsByOrganization = async (organizationId: string): Promise<TeamWithMembers[]> => {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members (
        *,
        profiles (
          name,
          email
        )
      )
    `)
    .eq('organization_id', organizationId)
    .order('name');

  if (error) throw error;

  // Transform the data to include teams even without members
  return (data || []).map((team: any) => ({
    ...team,
    members: team.team_members || [],
    member_count: (team.team_members || []).length
  }));
};

// Get single team with members
export const getTeamById = async (id: string): Promise<TeamWithMembers | null> => {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members (
        *,
        profiles (
          name,
          email
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    ...data,
    members: data.team_members || [],
    member_count: (data.team_members || []).length
  };
};

// Add member to team
export const addTeamMember = async (teamMemberData: TeamMemberInsert): Promise<TeamMember> => {
  const { data, error } = await supabase
    .from('team_members')
    .insert(teamMemberData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Remove member from team
export const removeTeamMember = async (teamId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (error) throw error;
};

// Update team member role
export const updateTeamMemberRole = async (
  teamId: string, 
  userId: string, 
  role: Database['public']['Enums']['team_member_role']
): Promise<TeamMember> => {
  const { data, error } = await supabase
    .from('team_members')
    .update({ role })
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get available users for team (organization members not in team)
export const getAvailableUsersForTeam = async (organizationId: string, teamId: string) => {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      user_id,
      profiles!inner (
        id,
        name,
        email
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .not('user_id', 'in', `(
      SELECT user_id FROM team_members WHERE team_id = '${teamId}'
    )`);

  if (error) throw error;
  return data || [];
};

// Check if user is team manager
export const isTeamManager = async (userId: string, teamId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .eq('role', 'manager')
    .maybeSingle();

  if (error) throw error;
  return !!data;
};

// Get teams user manages
export const getTeamsUserManages = async (userId: string): Promise<Team[]> => {
  // First get team IDs where user is manager
  const { data: teamMemberships, error: memberError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .eq('role', 'manager');

  if (memberError) throw memberError;
  
  if (!teamMemberships || teamMemberships.length === 0) {
    return [];
  }

  const teamIds = teamMemberships.map(tm => tm.team_id);
  
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .in('id', teamIds);

  if (error) throw error;
  return data || [];
};