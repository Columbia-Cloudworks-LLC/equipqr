import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOrganizationPermissions = (organizationId: string) => {
  return useQuery({
    queryKey: ['organization-permissions', organizationId],
    queryFn: async () => {
      if (!organizationId) return { isAdmin: false, isMember: false };

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return { isAdmin: false, isMember: false };

      // Direct query to check user's role in the organization
      const { data: memberData, error } = await supabase
        .from('organization_members')
        .select('role, status')
        .eq('organization_id', organizationId)
        .eq('user_id', userData.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching user permissions:', error);
        return { isAdmin: false, isMember: false };
      }

      const isAdmin = memberData?.role === 'owner' || memberData?.role === 'admin';
      const isMember = !!memberData;

      return { isAdmin, isMember };
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
  });
};