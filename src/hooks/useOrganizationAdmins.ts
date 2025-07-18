
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrganizationAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const useOrganizationAdmins = (organizationId: string) => {
  // Real-time subscriptions temporarily disabled to prevent subscription conflicts
  // TODO: Implement centralized subscription manager

  return useQuery({
    queryKey: ['organization-admins', organizationId],
    queryFn: async (): Promise<OrganizationAdmin[]> => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          profiles:user_id (
            id,
            name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .in('role', ['owner', 'admin']);

      if (error) {
        console.error('Error fetching organization admins:', error);
        return [];
      }

      return (data || []).map(member => ({
        id: member.user_id,
        name: (member.profiles as any)?.name || 'Unknown',
        email: (member.profiles as any)?.email || '',
        role: member.role
      }));
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
