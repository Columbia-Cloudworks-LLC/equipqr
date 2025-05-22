
import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { useTeamManagementOrgs } from '@/hooks/team/useTeamManagementOrgs';
import { useFilteredTeams } from '@/hooks/team/useFilteredTeams';
import { Organization } from '@/types';
import { TeamManagementContextType } from '@/contexts/TeamManagementContext';

export function useTeamManagementPage(): {
  contextValue: TeamManagementContextType;
  isAuthLoading: boolean;
  session: any;
} {
  const navigate = useNavigate();
  const { session, isLoading: isAuthLoading } = useAuth();
  
  // Get team management state and functions
  const teamManagement = useTeamManagement();
  const {
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
    isRepairingTeam,
    isUpgradingRole,
    isRequestingRole,
    isMember,
    currentUserRole,
    canChangeRoles,
    error,
    setSelectedTeamId,
    handleCreateTeam,
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
  } = teamManagement;
  
  // Organization and team state management
  const orgContext = useTeamManagementOrgs(organizations, fetchTeams, setSelectedTeamId);
  const { selectedOrgId, isChangingOrg, handleOrganizationChange, selectedOrganization } = orgContext;
  
  // Filter teams based on selected organization
  const filteredTeams = useFilteredTeams(teams, selectedOrgId, isChangingOrg);
  
  // Format organizations for the dropdown
  const formattedOrganizations = useMemo(() => organizations.map(org => ({
    id: org.id,
    name: org.name,
    role: org.role || 'viewer',
    is_primary: !!org.is_primary,
    created_at: org.created_at,
    updated_at: org.updated_at,
    owner_user_id: org.owner_user_id,
    user_id: (org as any).user_id
  })), [organizations]);

  // Authentication check
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

  // When filtered teams change, ensure we select a valid team
  useEffect(() => {
    if (isChangingOrg) {
      return;
    }
    
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
  }, [filteredTeams, selectedTeamId, setSelectedTeamId, isChangingOrg]);

  // Build the context value with all the state and functions
  const contextValue: TeamManagementContextType = {
    teams,
    members,
    pendingInvitations,
    selectedTeamId,
    organizations: formattedOrganizations,
    selectedOrgId,
    selectedOrganization,
    filteredTeams,
    isLoading,
    isLoadingInvitations,
    isCreatingTeam,
    isUpdatingTeam,
    isDeletingTeam,
    isRepairingTeam,
    isUpgradingRole,
    isRequestingRole,
    isMember,
    isChangingOrg,
    currentUserRole,
    canChangeRoles,
    error,
    setSelectedTeamId,
    handleOrganizationChange,
    handleCreateTeam,
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

  return {
    contextValue,
    isAuthLoading,
    session
  };
}
