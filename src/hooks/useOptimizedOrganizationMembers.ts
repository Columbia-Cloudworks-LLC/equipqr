import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { ORGANIZATION_MEMBERS_CONSTANTS } from '@/constants/organizationMembers';

export interface RealOrganizationMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
  joinedDate: string;
  avatar?: string;
}

// Optimized with single query using joins and better caching
export const useOptimizedOrganizationMembers = (organizationId: string) => {
  return useQuery({
    queryKey: ['organization-members-optimized', organizationId],
    queryFn: async (): Promise<RealOrganizationMember[]> => {
      if (!organizationId) return [];

      // Single optimized query with join instead of separate calls
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          role,
          status,
          joined_date,
          user_id,
          profiles:user_id!inner (
            id,
            name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .order('joined_date', { ascending: false });

      if (error) {
        console.error('Error fetching organization members:', error);
        throw error;
      }

      interface ProfileData {
        id?: string;
        name?: string;
        email?: string;
      }

      return (data || []).map(member => {
        const profile = member.profiles as ProfileData;
        return {
          id: member.user_id,
          name: profile?.name || 'Unknown',
          email: profile?.email || '',
          role: member.role as 'owner' | 'admin' | 'member',
          status: member.status as 'active' | 'pending' | 'inactive',
          joinedDate: member.joined_date,
          avatar: undefined
        };
      });
    },
    enabled: !!organizationId,
    staleTime: ORGANIZATION_MEMBERS_CONSTANTS.QUERY_STALE_TIME,
    gcTime: ORGANIZATION_MEMBERS_CONSTANTS.QUERY_GC_TIME,
  });
};

// Memoized computed values to avoid recalculating on every render
export const useOrganizationMemberStats = (organizationId: string) => {
  const { data: members = [] } = useOptimizedOrganizationMembers(organizationId);
  
  return useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'active');
    const pendingMembers = members.filter(m => m.status === 'pending');
    const adminCount = members.filter(m => m.role === 'admin' || m.role === 'owner').length;
    
    return {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      pendingMembers: pendingMembers.length,
      adminCount,
      members
    };
  }, [members]);
};

// Optimized mutation with optimistic updates
export const useUpdateMemberRole = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: 'admin' | 'member' }) => {
      const { data, error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('user_id', memberId) // Use user_id instead of id for consistency
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ memberId, newRole }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['organization-members-optimized', organizationId] });
      
      const previousMembers = queryClient.getQueryData(['organization-members-optimized', organizationId]);
      
      queryClient.setQueryData(['organization-members-optimized', organizationId], (old: RealOrganizationMember[] | undefined) => {
        if (!old) return old;
        return old.map(member => 
          member.id === memberId ? { ...member, role: newRole } : member
        );
      });
      
      return { previousMembers };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousMembers) {
        queryClient.setQueryData(['organization-members-optimized', organizationId], context.previousMembers);
      }
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    },
    onSuccess: () => {
      toast.success('Member role updated successfully');
    }
  });
};

export const useRemoveMember = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { data, error } = await supabase
        .from('organization_members')
        .delete()
        .eq('user_id', memberId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (memberId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['organization-members-optimized', organizationId] });
      
      const previousMembers = queryClient.getQueryData(['organization-members-optimized', organizationId]);
      
      queryClient.setQueryData(['organization-members-optimized', organizationId], (old: RealOrganizationMember[] | undefined) => {
        if (!old) return old;
        return old.filter(member => member.id !== memberId);
      });
      
      return { previousMembers };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousMembers) {
        queryClient.setQueryData(['organization-members-optimized', organizationId], context.previousMembers);
      }
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    },
    onSuccess: () => {
      toast.success('Member removed successfully');
    }
  });
};