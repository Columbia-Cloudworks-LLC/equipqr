
import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { useFilteredTeams } from '@/hooks/team/useFilteredTeams';
import { TeamManagementContextType } from '@/contexts/TeamManagementContext.d';
import { UserRole } from '@/types/supabase-enums';
import { Organization } from '@/types';

export function useTeamManagementPage(): {
  contextValue: TeamManagementContextType;
  isAuthLoading: boolean;
  session: any;
} {
  const navigate = useNavigate();
  const { session, isLoading: isAuthLoading } = useAuth();
  
  // Use global organization context directly
  const { selectedOrganization } = useOrganization();
  
  const teamManagement = useTeamManagement();
  const {
    members,
    pendingInvitations,
    organizationMembers,
    existingTeamMemberIds,
    teams,
    selectedTeamId,
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
    handleUpdateTeam: handleUpdateTeamBase,
    handleDeleteTeam: handleDeleteTeamBase,
    handleAddOrgMember: handleAddOrgMemberBase,
    handleInviteMember: handleInviteMemberBase,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation,
    handleUpgradeRole: handleUpgradeRoleBase,
    handleRequestRoleUpgrade: handleRequestRoleUpgradeBase,
    refetchTeamMembers,
    refetchPendingInvitations,
    fetchTeams,
    getTeamEquipmentCount: getTeamEquipmentCountBase,
    refetchOrgMembers
  } = teamManagement;
  
  const filteredTeams = useFilteredTeams(teams, selectedOrganization);

  useEffect(() => {
    if (!isAuthLoading && !session) {
      navigate('/auth', { 
        state: { 
          returnTo: '/teams',
          message: 'You need to sign in to access Team Management'
        } 
      });
    }
  }, [session, isAuthLoading, navigate]);

  useEffect(() => {
    if (filteredTeams.length > 0) {
      const teamExists = filteredTeams.some(team => team.id === selectedTeamId);
      
      if (!selectedTeamId || !teamExists) {
        console.log('Selecting first available team:', filteredTeams[0].id);
        setSelectedTeamId(filteredTeams[0].id);
      }
    } else {
      if (selectedTeamId) {
        console.log('No teams available, clearing selection');
        setSelectedTeamId('');
      }
    }
  }, [filteredTeams, selectedTeamId, setSelectedTeamId]);

  // Create wrapper functions that handle the different return types properly
  const wrappedHandleUpdateTeam = async (teamId: string, data: { name: string }): Promise<void> => {
    if (!teamId || !data.name) {
      throw new Error('Team ID and name are required');
    }
    // handleUpdateTeamBase returns void and throws on error
    await handleUpdateTeamBase(teamId, data.name);
  };

  const wrappedHandleAddOrgMember = async (userId: string, role: string): Promise<void> => {
    if (!userId || !role) {
      throw new Error('User ID and role are required');
    }
    // handleAddOrgMemberBase throws on error, so we don't need to check return value
    await handleAddOrgMemberBase(userId, role);
  };

  const wrappedHandleInviteMember = async (email: string, role: UserRole): Promise<void> => {
    if (!selectedTeamId) {
      throw new Error('No team selected');
    }
    return handleInviteMemberBase(email, role, selectedTeamId);
  };

  const wrappedHandleDeleteTeam = async (): Promise<void> => {
    if (!selectedTeamId) {
      throw new Error('No team selected');
    }
    // handleDeleteTeamBase returns void and throws on error
    await handleDeleteTeamBase(selectedTeamId);
  };

  const wrappedHandleUpgradeRole = async (): Promise<void> => {
    if (!selectedTeamId) {
      throw new Error('No team selected');
    }
    // handleUpgradeRoleBase returns void and throws on error
    await handleUpgradeRoleBase(selectedTeamId);
  };

  const wrappedHandleRequestRoleUpgrade = async (): Promise<void> => {
    if (!selectedTeamId) {
      throw new Error('No team selected');
    }
    // handleRequestRoleUpgradeBase returns void and throws on error
    await handleRequestRoleUpgradeBase(selectedTeamId);
  };

  const wrappedRefetchPendingInvitations = async () => {
    return refetchPendingInvitations();
  };

  // Fix the Organization type conversion
  const convertedSelectedOrganization: Organization | null = selectedOrganization ? {
    id: selectedOrganization.id,
    name: selectedOrganization.name,
    role: selectedOrganization.role || 'viewer'
  } : null;

  const contextValue: TeamManagementContextType = {
    teams,
    members,
    pendingInvitations,
    organizationMembers,
    existingTeamMemberIds,
    selectedTeamId,
    selectedOrganization: convertedSelectedOrganization,
    filteredTeams,
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
    handleUpdateTeam: wrappedHandleUpdateTeam,
    handleDeleteTeam: wrappedHandleDeleteTeam,
    handleAddOrgMember: wrappedHandleAddOrgMember,
    handleInviteMember: wrappedHandleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation,
    handleUpgradeRole: wrappedHandleUpgradeRole,
    handleRequestRoleUpgrade: wrappedHandleRequestRoleUpgrade,
    refetchTeamMembers,
    refetchPendingInvitations: wrappedRefetchPendingInvitations,
    fetchTeams,
    getTeamEquipmentCount: getTeamEquipmentCountBase,
    refetchOrgMembers
  };

  return {
    contextValue,
    isAuthLoading,
    session
  };
}
