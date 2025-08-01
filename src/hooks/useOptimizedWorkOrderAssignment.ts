
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AssignmentOption {
  id: string;
  name: string;
  type: 'user';
  email?: string;
  role?: string;
}

export const useOptimizedWorkOrderAssignment = (organizationId?: string) => {
  // Direct query for organization members - only technicians and managers
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
        .in('role', ['owner', 'admin', 'member']) // All active members can be assigned work orders
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

  // Combine data into assignment options (only users now)
  const assignmentOptions: AssignmentOption[] = membersQuery.data || [];

  return {
    assignmentOptions,
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    error: membersQuery.error
  };
};
