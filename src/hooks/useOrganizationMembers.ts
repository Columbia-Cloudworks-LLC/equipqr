
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';
import { removeOrganizationMember } from '@/services/organization/removeOrgMember';

interface Member {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

// Helper function to generate a random token
function generateInvitationToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

export function useOrganizationMembers(organizationId: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!organizationId) {
      console.warn('No organization ID provided');
      setMembers([]);
      return;
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

      setMembers(formattedMembers);
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
        const userIds = fallbackData?.map(role => role.user_id) || [];
        
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error fetching user profiles:', profilesError);
          }

          // Get auth users for email information
          const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
          
          if (usersError) {
            console.error('Error fetching auth users:', usersError);
          }

          const formattedFallbackMembers = fallbackData?.map((member: any) => {
            const profile = profilesData?.find(p => p.id === member.user_id);
            const authUser = users?.find(u => u.id === member.user_id);
            
            return {
              id: member.user_id,
              email: authUser?.email || 'Unknown email',
              full_name: profile?.display_name,
              role: member.role,
              created_at: member.assigned_at || new Date().toISOString()
            };
          }) || [];

          setMembers(formattedFallbackMembers);
        } else {
          setMembers([]);
        }
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        toast.error('Failed to load organization members');
        setMembers([]);
      }
    }
  }, [organizationId]);

  const fetchPendingInvitations = useCallback(async () => {
    if (!organizationId) {
      console.warn('No organization ID provided for invitations');
      setPendingInvitations([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('id, email, role, created_at')
        .eq('org_id', organizationId)
        .eq('status', 'pending');

      if (error) throw error;

      setPendingInvitations(data || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      toast.error('Failed to load pending invitations');
      setPendingInvitations([]);
    }
  }, [organizationId]);

  const refetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchMembers(), fetchPendingInvitations()]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchMembers, fetchPendingInvitations]);

  useEffect(() => {
    refetchMembers();
  }, [refetchMembers]);

  const handleInviteMember = useCallback(async (email: string, role: UserRole) => {
    if (!organizationId) {
      console.error('No organization ID available for invitation');
      return;
    }

    // Filter out admin role for organization invitations as it's not supported
    const validRole = role === 'admin' ? 'manager' : role;

    setIsInviting(true);
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
      await fetchPendingInvitations();
    } catch (error: any) {
      console.error('Error inviting member:', error);
      if (error.code === '23505') {
        toast.error('This user has already been invited or is already a member');
      } else {
        toast.error('Failed to send invitation');
      }
    } finally {
      setIsInviting(false);
    }
  }, [organizationId, fetchPendingInvitations]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    if (!organizationId) {
      console.error('No organization ID available for member removal');
      return;
    }

    try {
      const result = await removeOrganizationMember(organizationId, memberId);
      
      if (result.success) {
        toast.success(result.message || 'Member removed successfully');
        await fetchMembers();
      } else {
        toast.error(result.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  }, [organizationId, fetchMembers]);

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
      await fetchPendingInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  }, [fetchPendingInvitations]);

  return {
    members,
    pendingInvitations,
    isLoading,
    isInviting,
    handleInviteMember,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation,
    refetchMembers
  };
}
