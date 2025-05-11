
import { useState, useEffect } from 'react';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { useTeams } from './useTeams';
import { useTeamMembers } from './useTeamMembers';
import { useTeamMembership } from './useTeamMembership';
import { useRoleManagement } from './useRoleManagement';

export function useTeamManagement() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  
  // Use the smaller, focused hooks
  const { 
    teams,
    isLoading: isTeamsLoading,
    isCreatingTeam,
    error: teamsError,
    handleCreateTeam 
  } = useTeams();
  
  const {
    members,
    isLoading: isMembersLoading,
    error: membersError,
    fetchTeamMembers,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite
  } = useTeamMembers(selectedTeamId);
  
  const {
    isMember,
    isRepairingTeam,
    currentUserId,
    error: membershipError,
    handleRepairTeam
  } = useTeamMembership(selectedTeamId);
  
  const {
    currentUserRole,
    canChangeRoles,
    isUpgradingRole,
    isRequestingRole,
    handleRequestRoleUpgrade,
    handleUpgradeRole
  } = useRoleManagement(members, selectedTeamId);

  // Set the first team as selected if available and none is selected
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      console.log('Setting selected team to:', teams[0].id);
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  // Fetch team members when selectedTeamId changes
  useEffect(() => {
    if (selectedTeamId && isMember) {
      fetchTeamMembers();
    }
  }, [selectedTeamId, isMember]);

  // Combine errors from all sources
  const error = teamsError || membersError || membershipError;
  
  // Combined loading state
  const isLoading = isTeamsLoading || isMembersLoading;

  const refetchTeamMembers = () => {
    if (selectedTeamId && isMember) {
      fetchTeamMembers();
    }
  };

  const handleCreateAndSelectTeam = async (name: string) => {
    const team = await handleCreateTeam(name);
    if (team?.id) {
      setSelectedTeamId(team.id);
    }
  };

  return {
    members,
    teams,
    selectedTeamId,
    isLoading,
    isCreatingTeam,
    isRepairingTeam,
    isUpgradingRole,
    isRequestingRole,
    isMember,
    currentUserRole,
    canChangeRoles,
    error,
    setSelectedTeamId,
    handleCreateTeam: handleCreateAndSelectTeam,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleRepairTeam,
    handleUpgradeRole,
    handleRequestRoleUpgrade,
    refetchTeamMembers,
  };
}
