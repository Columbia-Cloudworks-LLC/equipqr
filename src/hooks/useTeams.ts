import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTeam } from '@/hooks/useTeam';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
}

export const useTeams = () => {
  const { teamMemberships } = useTeam();
  
  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Team[];
    },
  });

  // Get teams that the current user can manage (where they are a manager)
  const managedTeams = teams?.filter(team => 
    teamMemberships.some(membership => 
      membership.team_id === team.id && membership.role === 'manager'
    )
  ) || [];

  return {
    teams: teams || [],
    managedTeams,
    isLoading,
    error
  };
};

export const useTeamPermissions = () => {
  const { hasTeamRole, canManageTeam } = useTeam();
  
  return {
    hasTeamRole,
    canManageTeam,
    isTeamManager: (teamId: string) => hasTeamRole(teamId, 'manager')
  };
};