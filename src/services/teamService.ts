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
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Get teams by organization with member details
export const getTeamsByOrganization = async (organizationId: string): Promise<TeamWithMembers[]> => {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members!inner (
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

  // Transform the data to group members by team
  const teamsMap = new Map<string, TeamWithMembers>();
  
  (data || []).forEach((team: any) => {
    if (!teamsMap.has(team.id)) {
      teamsMap.set(team.id, {
        ...team,
        members: [],
        member_count: 0
      });
    }
    
    if (team.team_members) {
      const teamData = teamsMap.get(team.id)!;
      teamData.members.push(team.team_members);
      teamData.member_count = teamData.members.length;
    }
  });

  return Array.from(teamsMap.values());
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