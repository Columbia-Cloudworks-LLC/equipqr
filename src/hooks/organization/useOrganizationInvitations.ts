
import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';
import type { PendingInvitation } from './useOrganizationMembersState';

// Helper function to generate a random token
function generateInvitationToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

export function useOrganizationInvitations() {
  const fetchPendingInvitations = useCallback(async (organizationId: string): Promise<PendingInvitation[]> => {
    if (!organizationId) {
      console.warn('No organization ID provided for invitations');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('id, email, role, created_at')
        .eq('org_id', organizationId)
        .eq('status', 'pending');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      toast.error('Failed to load pending invitations');
      return [];
    }
  }, []);

  const handleInviteMember = useCallback(async (organizationId: string, email: string, role: UserRole) => {
    if (!organizationId) {
      console.error('No organization ID available for invitation');
      return;
    }

    // Filter out admin role for organization invitations as it's not supported
    const validRole = role === 'admin' ? 'manager' : role;

    try {
      // Get current user for created_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      const token = generateInvitationToken();

      const { error } = await supabase
        .from('organization_invitations')
        .insert({
          org_id: organizationId,
          email: email.toLowerCase(),
          role: validRole,
          token: token,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Invitation sent successfully');
    } catch (error: any) {
      console.error('Error inviting member:', error);
      if (error.code === '23505') {
        toast.error('This user has already been invited or is already a member');
      } else {
        toast.error('Failed to send invitation');
      }
      throw error;
    }
  }, []);

  const handleResendInvite = useCallback(async (invitationId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send_organization_invitation_email', {
        body: { invitation_id: invitationId }
      });

      if (error) throw error;

      toast.success('Invitation resent successfully');
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  }, []);

  const handleCancelInvitation = useCallback(async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitation cancelled');
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
      throw error;
    }
  }, []);

  return {
    fetchPendingInvitations,
    handleInviteMember,
    handleResendInvite,
    handleCancelInvitation
  };
}
