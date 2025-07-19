
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RealOrganizationMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
  joinedDate: string;
  avatar?: string;
}

export const useOrganizationMembers = (organizationId: string) => {
  // Real-time subscriptions temporarily disabled to prevent subscription conflicts
  // TODO: Implement centralized subscription manager

  return useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async (): Promise<RealOrganizationMember[]> => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          role,
          status,
          joined_date,
          user_id,
          profiles:user_id (
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

      return (data || []).map(member => ({
        id: member.user_id, // Use user_id as the ID for consistency
        name: (member.profiles as any)?.name || 'Unknown',
        email: (member.profiles as any)?.email || '',
        role: member.role as 'owner' | 'admin' | 'member',
        status: member.status as 'active' | 'pending' | 'inactive',
        joinedDate: member.joined_date,
        avatar: undefined
      }));
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useUpdateMemberRole = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: 'admin' | 'member' }) => {
      const { data, error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('user_id', memberId) // Use user_id for the update
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organizationId] });
      toast.success('Member role updated successfully');
    },
    onError: (error) => {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  });
};

interface RemovalResult {
  success: boolean;
  error?: string;
  removed_user_name?: string;
  removed_user_role?: string;
  teams_transferred?: number;
  new_manager_id?: string;
}

export const useRemoveMember = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('remove_organization_member_safely', {
        user_uuid: memberId,
        org_id: organizationId,
        removed_by: currentUser.user.id
      });

      if (error) throw error;

      const result = data as unknown as RemovalResult;

      // The function returns a JSON object with success status and details
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to remove member');
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organizationId] });
      
      // Show detailed success message based on what happened
      let message = `${data.removed_user_name} was removed successfully`;
      if (data.teams_transferred && data.teams_transferred > 0) {
        message += `. Team management for ${data.teams_transferred} team(s) was transferred to the organization owner.`;
      }
      
      toast.success(message);
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove member');
    }
  });
};
