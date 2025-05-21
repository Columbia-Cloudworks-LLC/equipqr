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
  const [isTeamDeleted, setIsTeamDeleted] = useState(false);

  const fetchTeamMembers = useCallback(async () => {
    if (!teamId) {
      console.warn('Cannot fetch team members: No team ID provided');
      setError('No team selected. Please select a team to view members.');
      setMembers([]);
      setIsLoading(false);
      setIsTeamDeleted(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setIsTeamDeleted(false);
      console.log(`Fetching members for team ${teamId}`);
      const data = await getTeamMembers(teamId);
      console.log('Fetched team members:', data);
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error in fetchTeamMembers:', error);
      
      // Check if this is a team not found/deleted error
      if (error.message?.includes('not found') || 
          error.message?.includes('been deleted') || 
          (error.code === "TEAM_NOT_FOUND")) {
        console.log('Team appears to be deleted, marking as such');
        setIsTeamDeleted(true);
        setError('This team has been deleted. Please select another team.');
        setMembers([]);
        toast.error("Team not found", {
          description: "This team may have been deleted. Please select another team.",
        });
      } else {
        setError(`Failed to load team members: ${error.message || 'Unknown error'}`);
        toast.error("Error fetching team members", {
          description: error.message || "Unknown error occurred",
        });
        setMembers([]);
      }
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
    
    // Don't try to fetch invitations for deleted teams
    if (isTeamDeleted) {
      setPendingInvitations([]);
      setIsLoadingInvitations(false);
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
      
      // Check if this is a team not found/deleted error
      if (error.message?.includes('not found') || 
          error.message?.includes('been deleted') || 
          (error.code === "TEAM_NOT_FOUND")) {
        console.log('Team appears to be deleted when fetching invitations');
        setIsTeamDeleted(true);
      }
      
      toast.error("Error fetching pending invitations", {
        description: error.message || "Unknown error occurred",
      });
      setPendingInvitations([]);
    } finally {
      setIsLoadingInvitations(false);
    }
  }, [teamId, isTeamDeleted]);

  const handleInviteMember = useCallback(async (email: string, role: UserRole, teamId: string) => {
    try {
      if (isTeamDeleted) {
        throw new Error('Cannot invite members to a deleted team');
      }
      
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
  }, [fetchTeamMembers, fetchPendingInvitations, isTeamDeleted]);

  const handleChangeRole = useCallback(async (id: string, role: UserRole, teamId: string) => {
    try {
      if (isTeamDeleted) {
        throw new Error('Cannot change roles in a deleted team');
      }
      
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
  }, [fetchTeamMembers, isTeamDeleted]);

  const handleRemoveMember = useCallback(async (id: string, teamId: string) => {
    try {
      if (isTeamDeleted) {
        throw new Error('Cannot remove members from a deleted team');
      }
      
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
  }, [fetchTeamMembers, isTeamDeleted]);

  const handleResendInvite = useCallback(async (id: string): Promise<void> => {
    try {
      if (isTeamDeleted) {
        throw new Error('Cannot resend invitations for a deleted team');
      }
      
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
  }, [fetchPendingInvitations, isTeamDeleted]);
  
  const handleCancelInvitation = useCallback(async (id: string): Promise<void> => {
    try {
      if (isTeamDeleted) {
        throw new Error('Cannot cancel invitations for a deleted team');
      }
      
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
  }, [fetchPendingInvitations, isTeamDeleted]);

  return {
    members,
    pendingInvitations,
    isLoading,
    isLoadingInvitations,
    error,
    isTeamDeleted,
    fetchTeamMembers,
    fetchPendingInvitations,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation
  };
}
