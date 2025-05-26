
import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { useFilteredTeams } from '@/hooks/team/useFilteredTeams';
import { TeamManagementContextType } from '@/contexts/TeamManagementContext.d';
import { UserRole } from '@/types/supabase-enums';

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
    getTeamEquipmentCount: getTeamEquipmentCountBase
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
    return handleUpdateTeamBase(teamId, data.name);
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

  const contextValue: TeamManagementContextType = {
    teams,
    members,
    pendingInvitations,
    selectedTeamId,
    selectedOrganization,
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
    getTeamEquipmentCount: getTeamEquipmentCountBase
  };

  return {
    contextValue,
    isAuthLoading,
    session
  };
}
