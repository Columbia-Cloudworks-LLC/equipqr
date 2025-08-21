
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAccessSnapshot } from './useAccessSnapshot';
import { useSimpleOrganization } from './useSimpleOrganization';

export interface OptimizedTeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'manager' | 'technician' | 'requestor' | 'viewer';
  joined_date: string;
  profiles: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface OptimizedTeam {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
  members: OptimizedTeamMember[];
  member_count: number;
}

export const useOptimizedTeams = () => {
  const { currentOrganization } = useSimpleOrganization();
  const { data: accessSnapshot } = useAccessSnapshot();

  return useQuery({
    queryKey: ['optimized-teams', currentOrganization?.id, accessSnapshot?.accessibleTeamIds],
    queryFn: async (): Promise<OptimizedTeam[]> => {
      if (!currentOrganization || !accessSnapshot) {
        return [];
      }

      // Get teams for the current organization
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        throw teamsError;
      }

      if (!teams || teams.length === 0) {
        return [];
      }

      // Filter teams based on access
      const accessibleTeamIds = new Set(accessSnapshot.accessibleTeamIds);
      const accessibleTeams = teams.filter(team => accessibleTeamIds.has(team.id));

      if (accessibleTeams.length === 0) {
        return [];
      }

      // Get team members for accessible teams
      const teamIds = accessibleTeams.map(team => team.id);
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .in('team_id', teamIds);

      if (membersError) {
        console.error('Error fetching team members:', membersError);
        throw membersError;
      }

      // Create a map of profiles from the access snapshot
      const profilesMap = new Map(
        accessSnapshot.profiles.map(profile => [profile.id, profile])
      );

      // Group members by team and enrich with profile data
      const membersByTeam = (teamMembers || []).reduce((acc, member) => {
        if (!acc[member.team_id]) {
          acc[member.team_id] = [];
        }
        
        const profile = profilesMap.get(member.user_id);
        acc[member.team_id].push({
          ...member,
          profiles: profile ? {
            id: profile.id,
            name: profile.name,
            email: profile.email
          } : null
        });
        
        return acc;
      }, {} as Record<string, OptimizedTeamMember[]>);

      // Combine teams with their members
      return accessibleTeams.map(team => ({
        ...team,
        members: membersByTeam[team.id] || [],
        member_count: (membersByTeam[team.id] || []).length
      }));
    },
    enabled: !!(currentOrganization && accessSnapshot),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
