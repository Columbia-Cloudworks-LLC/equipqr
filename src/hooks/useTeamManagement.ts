import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { 
  getTeams, 
  getTeamMembers,
  inviteMember, 
  changeRole, 
  removeMember, 
  resendInvite, 
  createTeam 
} from '@/services/team';

interface Team {
  id: string;
  name: string;
}

export function useTeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamMembers(selectedTeamId);
    } else {
      setMembers([]);
    }
  }, [selectedTeamId]);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedTeams = await getTeams();
      
      console.log('Fetched teams:', fetchedTeams);
      
      if (!fetchedTeams || fetchedTeams.length === 0) {
        console.log('No teams found');
        setTeams([]);
        return;
      }
      
      setTeams(fetchedTeams.map(team => ({ id: team.id, name: team.name })));
      
      // Set the first team as selected if available
      if (fetchedTeams.length > 0 && !selectedTeamId) {
        console.log('Setting selected team to:', fetchedTeams[0].id);
        setSelectedTeamId(fetchedTeams[0].id);
      }
    } catch (error: any) {
      console.error('Error in fetchTeams:', error);
      setError('Failed to load your teams. Please try again.');
      toast.error("Error fetching teams", {
        description: error.message || "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
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

  const refetchTeamMembers = () => {
    if (selectedTeamId) {
      fetchTeamMembers(selectedTeamId);
    }
  };

  const handleCreateTeam = async (name: string) => {
    try {
      setIsCreatingTeam(true);
      setError(null);
      await createTeam(name);
      toast.success("Team created successfully", {
        description: `Team "${name}" has been created`,
      });
      await fetchTeams();
    } catch (error: any) {
      console.error('Error in handleCreateTeam:', error);
      setError('Failed to create team. Please try again.');
      toast.error("Error creating team", {
        description: error.message,
      });
    } finally {
      setIsCreatingTeam(false);
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
      if (teamId === selectedTeamId) {
        fetchTeamMembers(selectedTeamId);
      }
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
      if (teamId === selectedTeamId) {
        fetchTeamMembers(selectedTeamId);
      }
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
      if (teamId === selectedTeamId) {
        fetchTeamMembers(selectedTeamId);
      }
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
    teams,
    selectedTeamId,
    isLoading,
    isCreatingTeam,
    error,
    setSelectedTeamId,
    handleCreateTeam,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    refetchTeamMembers,
  };
}
