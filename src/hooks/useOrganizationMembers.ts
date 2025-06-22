
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
        id: member.id,
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
        .eq('id', memberId)
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

export const useRemoveMember = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { data, error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organizationId] });
      toast.success('Member removed successfully');
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  });
};
