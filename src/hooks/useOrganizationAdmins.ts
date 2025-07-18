
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OrganizationAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const useOrganizationAdmins = (organizationId: string) => {
  const queryClient = useQueryClient();

  // Set up real-time subscription for organization admins
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel(`organization-admins-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_members',
          filter: `organization_id=eq.${organizationId}`
        },
        () => {
          // Invalidate and refetch the organization admins query
          queryClient.invalidateQueries({ queryKey: ['organization-admins', organizationId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          // Also invalidate when profiles change as admins display profile data
          queryClient.invalidateQueries({ queryKey: ['organization-admins', organizationId] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to organization-admins-${organizationId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to organization-admins-${organizationId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, queryClient]);

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
