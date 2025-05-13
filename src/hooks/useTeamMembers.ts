
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { 
  getTeamMembers,
  changeRole,
  removeMember,
  resendInvite,
  inviteMember,
  getPendingInvitations,
  cancelInvitation
} from '@/services/team';

export function useTeamMembers(teamId: string) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    if (!teamId) {
      console.warn('Cannot fetch team members: No team ID provided');
      setError('No team selected. Please select a team to view members.');
      setMembers([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      console.log(`Fetching members for team ${teamId}`);
      const data = await getTeamMembers(teamId);
      console.log('Fetched team members:', data);
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error in fetchTeamMembers:', error);
      setError(`Failed to load team members: ${error.message || 'Unknown error'}`);
      toast.error("Error fetching team members", {
        description: error.message || "Unknown error occurred",
      });
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  const fetchPendingInvitations = useCallback(async () => {
    if (!teamId) {
      console.warn('Cannot fetch pending invitations: No team ID provided');
      setPendingInvitations([]);
      return;
    }
    
    try {
      setIsLoadingInvitations(true);
      console.log(`Fetching pending invitations for team ${teamId}`);
      const data = await getPendingInvitations(teamId);
      console.log('Fetched pending invitations:', data);
      setPendingInvitations(data || []);
    } catch (error: any) {
      console.error('Error in fetchPendingInvitations:', error);
      toast.error("Error fetching pending invitations", {
        description: error.message || "Unknown error occurred",
      });
      setPendingInvitations([]);
    } finally {
      setIsLoadingInvitations(false);
    }
  }, [teamId]);

  const handleInviteMember = useCallback(async (email: string, role: UserRole, teamId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await inviteMember(email, role, teamId);
      
      if (result.success) {
        if (result.data?.directly_added) {
          toast.success("Member added", {
            description: `${email} was added directly to the team`,
          });
        } else {
          toast.success("Invitation sent", {
            description: `Invitation email sent to ${email}`,
          });
        }
      } else {
        toast.error("Invitation failed", {
          description: result.error || "Unknown error occurred",
        });
      }
      
      await Promise.all([
        fetchTeamMembers(),
        fetchPendingInvitations()
      ]);
    } catch (error: any) {
      console.error('Error in handleInviteMember:', error);
      setError('Failed to send invitation. Please try again.');
      toast.error("Error sending invitation", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchTeamMembers, fetchPendingInvitations]);

  const handleChangeRole = useCallback(async (id: string, role: UserRole, teamId: string) => {
    try {
      setError(null);
      await changeRole(id, role, teamId);
      toast.success("Role updated", {
        description: "Team member role updated successfully",
      });
      await fetchTeamMembers();
    } catch (error: any) {
      console.error('Error in handleChangeRole:', error);
      setError('Failed to update role. Please try again.');
      toast.error("Error updating role", {
        description: error.message,
      });
    }
  }, [fetchTeamMembers]);

  const handleRemoveMember = useCallback(async (id: string, teamId: string) => {
    try {
      setError(null);
      await removeMember(id, teamId);
      toast.success("Member removed", {
        description: "Team member removed successfully",
      });
      await fetchTeamMembers();
    } catch (error: any) {
      console.error('Error in handleRemoveMember:', error);
      setError('Failed to remove team member. Please try again.');
      toast.error("Error removing member", {
        description: error.message,
      });
    }
  }, [fetchTeamMembers]);

  const handleResendInvite = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await resendInvite(id);
      toast.success("Invitation resent", {
        description: "Invitation email has been resent",
      });
      await fetchPendingInvitations();
    } catch (error: any) {
      console.error('Error in handleResendInvite:', error);
      setError('Failed to resend invitation. Please try again.');
      toast.error("Error resending invitation", {
        description: error.message,
      });
    }
  }, [fetchPendingInvitations]);
  
  const handleCancelInvitation = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await cancelInvitation(id);
      toast.success("Invitation cancelled", {
        description: "The invitation has been cancelled",
      });
      await fetchPendingInvitations();
    } catch (error: any) {
      console.error('Error in handleCancelInvitation:', error);
      setError('Failed to cancel invitation. Please try again.');
      toast.error("Error cancelling invitation", {
        description: error.message,
      });
    }
  }, [fetchPendingInvitations]);

  return {
    members,
    pendingInvitations,
    isLoading,
    isLoadingInvitations,
    error,
    fetchTeamMembers,
    fetchPendingInvitations,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation
  };
}
