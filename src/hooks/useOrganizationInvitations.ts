import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  inviterName?: string;
  slot_reserved?: boolean;
  slot_purchase_id?: string;
  declined_at?: string;
  expired_at?: string;
}

export interface CreateInvitationData {
  email: string;
  role: 'admin' | 'member';
  message?: string;
  reserveSlot?: boolean;
}

export const useOrganizationInvitations = (organizationId: string) => {
  return useQuery({
    queryKey: ['organization-invitations', organizationId],
    queryFn: async (): Promise<OrganizationInvitation[]> => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('organization_invitations')
        .select(`
          id,
          email,
          role,
          status,
          message,
          invited_by,
          created_at,
          expires_at,
          accepted_at,
          slot_reserved,
          slot_purchase_id,
          declined_at,
          expired_at,
          profiles:invited_by (
            name
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        throw error;
      }

      return (data || []).map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role as 'admin' | 'member',
        status: invitation.status as 'pending' | 'accepted' | 'declined' | 'expired',
        message: invitation.message || undefined,
        invitedBy: invitation.invited_by,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
        acceptedAt: invitation.accepted_at || undefined,
        inviterName: (invitation.profiles as any)?.name || 'Unknown',
        slot_reserved: invitation.slot_reserved || false,
        slot_purchase_id: invitation.slot_purchase_id || undefined,
        declined_at: invitation.declined_at || undefined,
        expired_at: invitation.expired_at || undefined
      }));
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreateInvitation = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationData: CreateInvitationData) => {
      if (!organizationId) throw new Error('No organization ID provided');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          email: invitationData.email.toLowerCase().trim(),
          role: invitationData.role,
          message: invitationData.message || null,
          invited_by: userData.user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Reserve slot if requested and available
      if (invitationData.reserveSlot) {
        const { error: reserveError } = await supabase.rpc('reserve_slot_for_invitation', {
          org_id: organizationId,
          invitation_id: data.id
        });

        if (reserveError) {
          console.warn('Failed to reserve slot:', reserveError);
          // Don't throw here - invitation was created successfully
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['slot-availability', organizationId] });
      toast.success('Invitation sent successfully');
    },
    onError: (error: any) => {
      console.error('Error creating invitation:', error);
      if (error.code === '23505') {
        toast.error('An invitation to this email already exists');
      } else {
        toast.error('Failed to send invitation');
      }
    }
  });
};

export const useResendInvitation = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase
        .from('organization_invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'pending'
        })
        .eq('id', invitationId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', organizationId] });
      toast.success('Invitation resent successfully');
    },
    onError: (error) => {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  });
};

export const useCancelInvitation = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase
        .from('organization_invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['slot-availability', organizationId] });
      toast.success('Invitation cancelled successfully');
    },
    onError: (error) => {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  });
};
