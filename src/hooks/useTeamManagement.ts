import { useState, useEffect, useCallback } from 'react';
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
    isUpdatingTeam,
    isDeletingTeam,
    error: teamsError,
    fetchTeams,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    getTeamEquipmentCount
  } = useTeams();
  
  const {
    members,
    pendingInvitations,
    isLoading: isMembersLoading,
    isLoadingInvitations,
    error: membersError,
    fetchTeamMembers,
    fetchPendingInvitations,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation
  } = useTeamMembers(selectedTeamId);
  
  const {
    isMember,
    isRepairingTeam,
    currentUserId,
    accessRole,
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
  } = useRoleManagement(members, selectedTeamId, accessRole);

  // Refresh teams when component mounts
  useEffect(() => {
    console.log('useTeamManagement: Initial teams fetch');
    fetchTeams();
  }, []);

  // Set the first team as selected if available and none is selected
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      console.log('Setting selected team to:', teams[0].id);
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  // Fetch team members when selectedTeamId changes
  useEffect(() => {
    if (selectedTeamId && selectedTeamId !== 'none') {
      console.log(`Selected team changed to: ${selectedTeamId}, isMember: ${isMember}`);
      if (isMember) {
        fetchTeamMembers();
        fetchPendingInvitations();
      }
    }
  }, [selectedTeamId, isMember]);

  // Combine errors from all sources
  const error = teamsError || membersError || membershipError;
  
  // Combined loading state
  const isLoading = isTeamsLoading || isMembersLoading;

  // Memoize functions to prevent unnecessary re-renders
  const refetchTeamMembers = useCallback(() => {
    if (selectedTeamId && selectedTeamId !== 'none' && isMember) {
      fetchTeamMembers();
    }
  }, [selectedTeamId, isMember, fetchTeamMembers]);
  
  const refetchPendingInvitations = useCallback(() => {
    if (selectedTeamId && selectedTeamId !== 'none' && isMember) {
      fetchPendingInvitations();
    }
  }, [selectedTeamId, isMember, fetchPendingInvitations]);

  const handleCreateAndSelectTeam = useCallback(async (name: string) => {
    const team = await handleCreateTeam(name);
    if (team?.id) {
      setSelectedTeamId(team.id);
    }
    return team;
  }, [handleCreateTeam]);
  
  // Log for debugging
  useEffect(() => {
    console.log('useTeamManagement state:', {
      teams: teams.length,
      selectedTeamId,
      isLoading,
      isMember,
      members: members.length,
      currentUserRole,
      accessRole
    });
  }, [teams.length, selectedTeamId, isLoading, isMember, members.length, currentUserRole, accessRole]);

  return {
    members,
    pendingInvitations,
    teams,
    selectedTeamId,
    isLoading,
    isLoadingInvitations,
    isCreatingTeam,
    isUpdatingTeam,
    isDeletingTeam,
    isRepairingTeam,
    isUpgradingRole,
    isRequestingRole,
    isMember,
    currentUserRole,
    canChangeRoles,
    error,
    setSelectedTeamId,
    handleCreateTeam: handleCreateAndSelectTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation,
    handleRepairTeam,
    handleUpgradeRole,
    handleRequestRoleUpgrade,
    refetchTeamMembers,
    refetchPendingInvitations,
    fetchTeams,
    getTeamEquipmentCount
  };
}
