
import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { useTeamManagementOrgs } from '@/hooks/team/useTeamManagementOrgs';
import { useFilteredTeams } from '@/hooks/team/useFilteredTeams';
import { Organization } from '@/types';
import { TeamManagementContextType } from '@/contexts/TeamManagementContext.d';
import { UserRole } from '@/types/supabase-enums';

export function useTeamManagementPage(): {
  contextValue: TeamManagementContextType;
  isAuthLoading: boolean;
  session: any;
} {
  const navigate = useNavigate();
  const { session, isLoading: isAuthLoading } = useAuth();
  
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
    handleUpgradeRole,
    handleRequestRoleUpgrade,
    refetchTeamMembers,
    refetchPendingInvitations,
    fetchTeams,
    getTeamEquipmentCount: getTeamEquipmentCountBase
  } = teamManagement;
  
  const orgContext = useTeamManagementOrgs(organizations, fetchTeams, setSelectedTeamId);
  const { selectedOrgId, isChangingOrg, handleOrganizationChange, selectedOrganization } = orgContext;
  
  const filteredTeams = useFilteredTeams(teams, selectedOrgId, isChangingOrg);
  
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

  // Fixed: This function signature now matches the interface expectation (no parameters)
  const wrappedGetTeamEquipmentCount = async () => {
    if (!selectedTeamId) {
      return 0;
    }
    return getTeamEquipmentCountBase(selectedTeamId);
  };

  const wrappedRefetchPendingInvitations = async () => {
    return refetchPendingInvitations();
  };

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
    handleUpdateTeam: wrappedHandleUpdateTeam,
    handleDeleteTeam: wrappedHandleDeleteTeam,
    handleInviteMember: wrappedHandleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation,
    handleUpgradeRole,
    handleRequestRoleUpgrade,
    refetchTeamMembers,
    refetchPendingInvitations: wrappedRefetchPendingInvitations,
    fetchTeams,
    getTeamEquipmentCount: wrappedGetTeamEquipmentCount
  };

  return {
    contextValue,
    isAuthLoading,
    session
  };
}
