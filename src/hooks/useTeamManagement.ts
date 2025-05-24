
import { useCallback, useEffect } from 'react';
import { UserRole } from '@/types/supabase-enums';
import { useTeams } from './useTeams';
import { useTeamMembers } from './useTeamMembers';
import { useTeamMembership } from './useTeamMembership';
import { useRoleManagement } from './useRoleManagement';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTeamSelection } from './team/useTeamSelection';
import { useTeamOperationState } from './team/useTeamOperationState';
import { useTeamCreation } from './team/useTeamCreation';

export function useTeamManagement() {
  const { organizations, selectedOrganization } = useOrganization();
  
  // Use the smaller, focused hooks
  const { 
    teams,
    isLoading: isTeamsLoading,
    isCreatingTeam,
    isUpdatingTeam,
    isDeletingTeam,
    error: teamsError,
    fetchTeams,
    retryFetchTeams,
    handleCreateTeam: handleCreateTeamBase,
    handleUpdateTeam,
    handleDeleteTeam,
    getTeamEquipmentCount
  } = useTeams();
  
  // Use the team selection hook
  const {
    selectedTeamId,
    setSelectedTeamId,
    handleDeleteAndUpdateSelection
  } = useTeamSelection(teams);
  
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
    currentUserId,
    accessRole,
    error: membershipError,
    retryAccessCheck
  } = useTeamMembership(selectedTeamId);
  
  const {
    currentUserRole,
    organizationRole,
    canChangeRoles,
    isUpgradingRole,
    isRequestingRole,
    handleRequestRoleUpgrade,
    handleUpgradeRole
  } = useRoleManagement(members, selectedTeamId, accessRole);

  // Use the operation state hook for error and loading management
  const { error, isLoading } = useTeamOperationState(
    teamsError,
    membersError,
    membershipError,
    isTeamsLoading,
    isMembersLoading
  );

  // Use the team creation hook with team selection capability
  const { handleCreateTeam } = useTeamCreation(handleCreateTeamBase, setSelectedTeamId);

  // Refresh teams when component mounts
  useEffect(() => {
    console.log('useTeamManagement: Initial teams fetch');
    fetchTeams();
  }, [fetchTeams]);

  // Fetch team members when selectedTeamId changes
  useEffect(() => {
    if (selectedTeamId && selectedTeamId !== 'none') {
      console.log(`Selected team changed to: ${selectedTeamId}, isMember: ${isMember}`);
      
      // Even if not a member yet, try to fetch data
      // This handles race conditions where isMember hasn't updated yet
      fetchTeamMembers();
      fetchPendingInvitations();
    }
  }, [selectedTeamId, fetchTeamMembers, fetchPendingInvitations, isMember]);

  // Retry logic for empty teams list
  useEffect(() => {
    if (teams.length === 0 && !isTeamsLoading) {
      // Wait a bit and retry once
      const timer = setTimeout(() => {
        console.log('No teams found, retrying fetch...');
        retryFetchTeams();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [teams.length, isTeamsLoading, retryFetchTeams]);

  // Memoize functions to prevent unnecessary re-renders
  const refetchTeamMembers = useCallback(() => {
    if (selectedTeamId && selectedTeamId !== 'none') {
      fetchTeamMembers();
    }
  }, [selectedTeamId, fetchTeamMembers]);
  
  const refetchPendingInvitations = useCallback(async () => {
    if (selectedTeamId && selectedTeamId !== 'none') {
      return fetchPendingInvitations();
    }
    return Promise.resolve();
  }, [selectedTeamId, fetchPendingInvitations]);
  
  // Enhanced delete team handler that updates selection if needed
  const handleDeleteTeamWrapper = useCallback(async (teamId: string): Promise<any> => {
    return handleDeleteAndUpdateSelection(handleDeleteTeam, teamId);
  }, [handleDeleteTeam, handleDeleteAndUpdateSelection]);
  
  // Log for debugging
  useEffect(() => {
    console.log('useTeamManagement state:', {
      teams: teams.length,
      selectedTeamId,
      isLoading,
      isMember,
      members: members.length,
      currentUserRole,
      accessRole,
      organizationRole
    });
  }, [teams.length, selectedTeamId, isLoading, isMember, members.length, currentUserRole, accessRole, organizationRole]);

  return {
    members,
    pendingInvitations,
    teams,
    selectedTeamId,
    organizations,
    isLoading,
    isLoadingInvitations,
    isCreatingTeam,
    isUpdatingTeam,
    isDeletingTeam,
    isUpgradingRole,
    isRequestingRole,
    isMember,
    currentUserRole,
    canChangeRoles,
    error,
    setSelectedTeamId,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam: handleDeleteTeamWrapper,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation,
    handleUpgradeRole,
    handleRequestRoleUpgrade,
    refetchTeamMembers,
    refetchPendingInvitations,
    fetchTeams,
    getTeamEquipmentCount
  };
}
