
import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Member } from './useOrganizationMembersState';

export function useOrganizationMembersFetcher() {
  const fetchMembers = useCallback(async (organizationId: string): Promise<Member[]> => {
    if (!organizationId) {
      console.warn('No organization ID provided');
      return [];
    }

    try {
      console.log('Fetching organization members for org:', organizationId);
      
      // Use the database function to get organization members with proper relationships
      const { data: membersData, error: membersError } = await supabase
        .rpc('get_organization_members', { org_id: organizationId });

      if (membersError) {
        console.error('Error fetching members via RPC:', membersError);
        throw membersError;
      }

      console.log('Fetched members via RPC:', membersData);

      const formattedMembers = membersData?.map((member: any) => ({
        id: member.user_id,
        email: member.email || '',
        full_name: member.name,
        role: member.role,
        created_at: member.joined_at || new Date().toISOString()
      })) || [];

      return formattedMembers;
    } catch (error) {
      console.error('Error fetching members:', error);
      
      // Fallback to direct query if RPC fails
      try {
        console.log('Attempting fallback query for organization members');
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_roles')
          .select(`
            id,
            role,
            user_id,
            assigned_at
          `)
          .eq('org_id', organizationId);

        if (fallbackError) throw fallbackError;

        // Get user profiles separately to avoid foreign key issues
        const userIds = fallbackData?.map((role: any) => role.user_id) || [];
        
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error fetching user profiles:', profilesError);
          }

          // Get auth users for email information
          const { data: authData, error: usersError } = await supabase.auth.admin.listUsers();
          
          if (usersError) {
            console.error('Error fetching auth users:', usersError);
          }

          const users = authData?.users || [];

          const formattedFallbackMembers = fallbackData?.map((member: any) => {
            const profile = profilesData?.find((p: any) => p.id === member.user_id);
            const authUser = users?.find((u: any) => u.id === member.user_id);
            
            return {
              id: member.user_id,
              email: authUser?.email || 'Unknown email',
              full_name: profile?.display_name,
              role: member.role,
              created_at: member.assigned_at || new Date().toISOString()
            };
          }) || [];

          return formattedFallbackMembers;
        } else {
          return [];
        }
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        toast.error('Failed to load organization members');
        return [];
      }
    }
  }, []);

  return { fetchMembers };
}
