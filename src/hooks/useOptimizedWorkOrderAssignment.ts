import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getOrganizationTeamsOptimized } from '@/services/optimizedTeamService';

export interface AssignmentOption {
  id: string;
  name: string;
  type: 'user' | 'team';
  email?: string;
  role?: string;
}

export const useOptimizedWorkOrderAssignment = (organizationId?: string) => {
  // Direct query for organization members
  const membersQuery = useQuery({
    queryKey: ['optimized-assignment-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          profiles!inner (
            id,
            name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('profiles.name');

      if (error) throw error;
      
      return (data || []).map(member => ({
        id: member.profiles.id,
        name: member.profiles.name,
        email: member.profiles.email,
        role: member.role,
        type: 'user' as const
      }));
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Direct query for teams
  const teamsQuery = useQuery({
    queryKey: ['optimized-assignment-teams', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      return await getOrganizationTeamsOptimized(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Combine data into assignment options
  const assignmentOptions: AssignmentOption[] = [
    ...(membersQuery.data || []),
    ...(teamsQuery.data || []).map(team => ({
      id: team.id,
      name: `${team.name} (Team)`,
      type: 'team' as const
    }))
  ];

  return {
    assignmentOptions,
    members: membersQuery.data || [],
    teams: teamsQuery.data || [],
    isLoading: membersQuery.isLoading || teamsQuery.isLoading,
    error: membersQuery.error || teamsQuery.error
  };
};