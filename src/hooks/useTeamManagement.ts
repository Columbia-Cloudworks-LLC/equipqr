
import { useCallback, useEffect } from 'react';
import { UserRole } from '@/types/supabase-enums';
import { useTeams } from './useTeams';
import { useTeamMembers } from './useTeamMembers';
import { useTeamMembership } from './useTeamMembership';
import { useRoleManagement } from './useRoleManagement';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationMembers } from './useOrganizationMembers';
import { useTeamSelection } from './team/useTeamSelection';
import { useTeamOperationState } from './team/useTeamOperationState';
import { useTeamCreation } from './team/useTeamCreation';

export function useTeamManagement() {
  const { selectedOrganization } = useOrganization();
  
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
    handleAddOrgMember,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation
  } = useTeamMembers(selectedTeamId);
  
  // Get organization members for the add member functionality
  const {
    members: organizationMembers,
    isLoading: isLoadingOrgMembers,
    refetchMembers: refetchOrgMembers
  } = useOrganizationMembers(selectedOrganization?.id || '');

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

  // IMPORTANT: Re-fetch teams and clear selection when organization changes
  useEffect(() => {
    if (selectedOrganization) {
      console.log(`Organization changed to: ${selectedOrganization.name}, fetching teams...`);
      setSelectedTeamId(''); // Clear team selection
      fetchTeams(); // Fetch teams for new organization
    }
  }, [selectedOrganization?.id, fetchTeams, setSelectedTeamId]);

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
  
  // Get existing team member IDs for filtering
  const existingTeamMemberIds = members.map(member => member.auth_uid || member.user_id).filter(Boolean);
  
  // Log for debugging
  useEffect(() => {
    console.log('useTeamManagement state:', {
      teams: teams.length,
      selectedTeamId,
      isLoading,
      isMember,
      members: members.length,
      orgMembers: organizationMembers.length,
      currentUserRole,
      accessRole,
      organizationRole,
      selectedOrg: selectedOrganization?.name
    });
  }, [teams.length, selectedTeamId, isLoading, isMember, members.length, organizationMembers.length, currentUserRole, accessRole, organizationRole, selectedOrganization?.name]);

  return {
    members,
    pendingInvitations,
    organizationMembers,
    existingTeamMemberIds,
    teams,
    selectedTeamId,
    selectedOrganization,
    isLoading: isLoading || isLoadingOrgMembers,
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
    handleAddOrgMember,
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
    getTeamEquipmentCount,
    refetchOrgMembers
  };
}
