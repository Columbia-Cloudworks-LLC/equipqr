
import { useState } from 'react';
import { toast } from 'sonner';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { 
  getTeamMembers,
  inviteMember, 
  changeRole, 
  removeMember, 
  resendInvite
} from '@/services/team';

export function useTeamMembers(teamId: string) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = async () => {
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
  };

  const handleInviteMember = async (email: string, role: UserRole, teamId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await inviteMember(email, role, teamId);
      toast.success("Invitation sent", {
        description: `Invitation email sent to ${email}`,
      });
      await fetchTeamMembers();
    } catch (error: any) {
      console.error('Error in handleInviteMember:', error);
      setError('Failed to send invitation. Please try again.');
      toast.error("Error sending invitation", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (id: string, role: UserRole, teamId: string) => {
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
  };

  const handleRemoveMember = async (id: string, teamId: string) => {
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
  };

  const handleResendInvite = async (id: string) => {
    try {
      setError(null);
      await resendInvite(id);
      toast.success("Invitation resent", {
        description: "Invitation email has been resent",
      });
    } catch (error: any) {
      console.error('Error in handleResendInvite:', error);
      setError('Failed to resend invitation. Please try again.');
      toast.error("Error resending invitation", {
        description: error.message,
      });
    }
  };

  return {
    members,
    isLoading,
    error,
    fetchTeamMembers,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite
  };
}
