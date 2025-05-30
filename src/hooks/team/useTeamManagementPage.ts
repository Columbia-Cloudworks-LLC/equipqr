
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

  // Create wrapper functions that match the context interface signatures exactly
  const wrappedHandleUpdateTeam = async (teamId: string, data: { name: string }) => {
    if (!teamId || !data.name) {
      throw new Error('Team ID and name are required');
    }
    return handleUpdateTeamBase(teamId, data.name);
  };

  const wrappedHandleAddOrgMember = async (userId: string, role: string) => {
    if (!userId || !role) {
      throw new Error('User ID and role are required');
    }
    return handleAddOrgMemberBase(userId, role);
  };

  const wrappedHandleInviteMember = async (email: string, role: UserRole) => {
    if (!selectedTeamId) {
      throw new Error('No team selected');
    }
    return handleInviteMemberBase(email, role, selectedTeamId);
  };

  const wrappedHandleDeleteTeam = async () => {
    if (!selectedTeamId) {
      throw new Error('No team selected');
    }
    return handleDeleteTeamBase(selectedTeamId);
  };

  const wrappedHandleUpgradeRole = async () => {
    if (!selectedTeamId) {
      throw new Error('No team selected');
    }
    return handleUpgradeRoleBase(selectedTeamId);
  };

  const wrappedHandleRequestRoleUpgrade = async () => {
    if (!selectedTeamId) {
      throw new Error('No team selected');
    }
    return handleRequestRoleUpgradeBase(selectedTeamId);
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
