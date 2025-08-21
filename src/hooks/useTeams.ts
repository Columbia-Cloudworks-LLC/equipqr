
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTeam } from '@/hooks/useTeam';
import { useSimpleOrganization } from '@/hooks/useSimpleOrganization';
import { useOptimizedTeams } from '@/hooks/useOptimizedTeams';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
}

export const useTeams = () => {
  const { teamMemberships } = useTeam();
  const { currentOrganization } = useSimpleOrganization();
  
  // Use the optimized teams hook for better performance
  const { data: optimizedTeams, isLoading: optimizedLoading, error: optimizedError } = useOptimizedTeams();
  
  // Fallback to the old method if optimized fails
  const { data: fallbackTeams, isLoading: fallbackLoading, error: fallbackError } = useQuery({
    queryKey: ['teams-fallback', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');
      
      if (error) throw error;
      return data as Team[];
    },
    enabled: !!currentOrganization?.id && !!optimizedError,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Use optimized teams if available, otherwise fallback
  const teams = optimizedTeams || fallbackTeams || [];
  const isLoading = optimizedLoading || (optimizedError ? fallbackLoading : false);
  const error = optimizedError && fallbackError ? fallbackError : null;

  // Get teams that the current user can manage (where they are a manager)
  const managedTeams = teams.filter(team => 
    teamMemberships.some(membership => 
      membership.team_id === team.id && membership.role === 'manager'
    )
  );

  return {
    teams,
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
