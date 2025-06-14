import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { getTeamMembersWithOrgManagers } from '@/services/team/members/getTeamMembersWithOrgManagers';
import { changeRole } from '@/services/team/members/changeRole';
import { removeMember } from '@/services/team/members/removeMember';
import { addOrgMemberToTeam } from '@/services/team/members/addOrgMemberToTeam';
import { resendInvite } from '@/services/team/invitation/resendInvite';
import { inviteMember } from '@/services/team/invitation/inviteMember';
import { getPendingInvitations } from '@/services/team/invitation/getPendingInvitations';
import { cancelInvitation } from '@/services/team/invitation/cancelInvitation';
import { supabase } from '@/integrations/supabase/client';

export function useTeamMembers(teamId: string | null) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTeamDeleted, setIsTeamDeleted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

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
      console.log(`Fetching members for team ${teamId} with org managers`);
      
      // Use the enhanced function that includes org managers
      const data = await getTeamMembersWithOrgManagers(teamId);
      console.log('Fetched team members with org managers:', data);
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
          description: "This team may have been deleted. Please select another team."
        });
      } else {
        setError(`Failed to load team members: ${error.message || 'Unknown error'}`);
        toast.error("Error fetching team members", {
          description: error.message || "Unknown error occurred"
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
      
      // Use the edge function to get pending invitations
      const { data, error } = await supabase.functions.invoke('get_pending_invitations', {
        body: { team_id: teamId }
      });
      
      if (error) {
        console.error('Error fetching pending invitations:', error);
        if (error.message?.includes('permission')) {
          // This is expected for viewers - just return empty array
          setPendingInvitations([]);
        } else {
          throw new Error(error.message);
        }
      } else {
        console.log('Fetched pending invitations:', data?.invitations);
        setPendingInvitations(data?.invitations || []);
      }
    } catch (error: any) {
      console.error('Error in fetchPendingInvitations:', error);
      
      // Check if this is a team not found/deleted error
      if (error.message?.includes('not found') || 
          error.message?.includes('been deleted') || 
          (error.code === "TEAM_NOT_FOUND")) {
        console.log('Team appears to be deleted when fetching invitations');
        setIsTeamDeleted(true);
      }
      
      // Don't show toasts for permission errors
      if (!error.message?.includes('permission')) {
        toast.error("Error fetching pending invitations", {
          description: error.message || "Unknown error occurred"
        });
      }
      
      setPendingInvitations([]);
    } finally {
      setIsLoadingInvitations(false);
    }
  }, [teamId, isTeamDeleted]);

  // Allow forcing a retry
  const retryFetch = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  // Effect to refetch when retry count changes
  useEffect(() => {
    if (teamId) {
      fetchTeamMembers();
      fetchPendingInvitations();
    }
  }, [teamId, retryCount, fetchTeamMembers, fetchPendingInvitations]);

  // Modified to accept three separate parameters instead of data object
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
            description: `${email} was added directly to the team`
          });
        } else {
          toast.success("Invitation sent", {
            description: `Invitation email sent to ${email}`
          });
        }
      } else {
        toast.error("Invitation failed", {
          description: result.error || "Unknown error occurred"
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
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchTeamMembers, fetchPendingInvitations, isTeamDeleted]);

  const handleChangeRole = useCallback(async (userId: string, role: UserRole) => {
    try {
      if (!teamId || isTeamDeleted) {
        throw new Error('Cannot change roles in a deleted team');
      }
      
      console.log('handleChangeRole called with:', { teamId, userId, role });
      setError(null);
      
      // Fix: Correct parameter order - teamId, userId, role
      const result = await changeRole(teamId, userId, role);
      
      if (result.success) {
        toast.success("Role updated", {
          description: "Team member role updated successfully"
        });
        
        // Force refresh of team members data
        console.log('Role change successful, refreshing team members...');
        await fetchTeamMembers();
      } else {
        throw new Error(result.error || 'Failed to update role');
      }
    } catch (error: any) {
      console.error('Error in handleChangeRole:', error);
      setError('Failed to update role. Please try again.');
      toast.error("Error updating role", {
        description: error.message
      });
    }
  }, [fetchTeamMembers, teamId, isTeamDeleted]);

  const handleRemoveMember = useCallback(async (userId: string) => {
    try {
      if (!teamId || isTeamDeleted) {
        throw new Error('Cannot remove members from a deleted team');
      }
      
      setError(null);
      await removeMember(teamId, userId);
      toast.success("Member removed", {
        description: "Team member removed successfully"
      });
      await fetchTeamMembers();
    } catch (error: any) {
      console.error('Error in handleRemoveMember:', error);
      setError('Failed to remove team member. Please try again.');
      toast.error("Error removing member", {
        description: error.message
      });
    }
  }, [fetchTeamMembers, teamId, isTeamDeleted]);

  const handleAddOrgMember = useCallback(async (userId: string, role: string) => {
    if (!teamId || isTeamDeleted) {
      throw new Error('Cannot add members to a deleted team');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await addOrgMemberToTeam(userId, teamId, role);
      
      if (result.success) {
        toast.success("Member added", {
          description: "Organization member was added to the team successfully"
        });
        await fetchTeamMembers();
      } else {
        throw new Error(result.error || 'Failed to add member');
      }
    } catch (error: any) {
      console.error('Error in handleAddOrgMember:', error);
      setError('Failed to add organization member. Please try again.');
      toast.error("Error adding member", {
        description: error.message
      });
      throw error; // Re-throw to allow form handling
    } finally {
      setIsLoading(false);
    }
  }, [teamId, isTeamDeleted, fetchTeamMembers]);

  const handleResendInvite = useCallback(async (id: string): Promise<void> => {
    try {
      if (isTeamDeleted) {
        throw new Error('Cannot resend invitations for a deleted team');
      }
      
      setError(null);
      await resendInvite(id);
      toast.success("Invitation resent", {
        description: "Invitation email has been resent"
      });
      await fetchPendingInvitations();
    } catch (error: any) {
      console.error('Error in handleResendInvite:', error);
      setError('Failed to resend invitation. Please try again.');
      toast.error("Error resending invitation", {
        description: error.message
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
        description: "The invitation has been cancelled"
      });
      await fetchPendingInvitations();
    } catch (error: any) {
      console.error('Error in handleCancelInvitation:', error);
      setError('Failed to cancel invitation. Please try again.');
      toast.error("Error cancelling invitation", {
        description: error.message
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
    retryFetch,
    handleAddOrgMember,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation
  };
}
