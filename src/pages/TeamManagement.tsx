import { useEffect, useMemo } from 'react';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { ErrorDisplay } from '@/components/Team/ErrorDisplay';
import { EmptyTeamState } from '@/components/Team/EmptyTeamState';
import { Layout } from '@/components/Layout/Layout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TeamManagementHeader } from '@/components/Team/TeamManagementHeader';
import { OrganizationAlert } from '@/components/Team/OrganizationAlert';
import { AuthLoadingState } from '@/components/Team/AuthLoadingState';
import { OrgSwitcherLoading } from '@/components/Team/OrgSwitcherLoading';
import { useFilteredTeams } from '@/hooks/team/useFilteredTeams';
import { Organization } from '@/types';
import { TeamManagementWrapper } from '@/components/Team/TeamManagementWrapper';
import { useTeamManagementOrgs } from '@/hooks/team/useTeamManagementOrgs';
import { useTeamFunctionWrappers } from '@/hooks/team/useTeamFunctionWrappers';
import { UserRole } from '@/types/supabase-enums';

export default function TeamManagement() {
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
    isMember,
    isUpgradingRole,
    isRequestingRole,
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
  } = useTeamManagement();

  const navigate = useNavigate();
  const { session, isLoading: isAuthLoading } = useAuth();
  
  // Organization and team state management
  const orgContext = useTeamManagementOrgs(organizations, fetchTeams, setSelectedTeamId);
  const { selectedOrgId, isChangingOrg, handleOrganizationChange, selectedOrganization } = orgContext;
  
  // Filter teams based on selected organization
  const filteredTeams = useFilteredTeams(teams, selectedOrgId, isChangingOrg);
  
  // Convert UserOrganization[] to Organization[]
  const formattedOrganizations: Organization[] = useMemo(() => organizations.map(org => ({
    id: org.id,
    name: org.name,
    role: org.role || 'viewer',
    is_primary: !!org.is_primary,
    created_at: org.created_at,
    updated_at: org.updated_at,
    owner_user_id: org.owner_user_id,
    user_id: (org as any).user_id
  })), [organizations]);

  // Track if viewing external organization teams
  const isExternalOrg = selectedOrganization && !selectedOrganization.is_primary;
  
  // Function wrappers for team operations with updated type to explicitly use Promise<any> instead of Promise<void>
  const functionWrappers = useTeamFunctionWrappers(
    selectedTeamId,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam as (teamId: string) => Promise<any>, // Explicitly cast to Promise<any>
    handleRepairTeam,
    handleUpgradeRole,
    handleRequestRoleUpgrade
  );
  
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

  // Determine if the user has viewer role only
  const isViewerOnly = isMember && currentUserRole === 'viewer';

  // Show loading state during auth check
  if (isAuthLoading) {
    return (
      <Layout>
        <AuthLoadingState />
      </Layout>
    );
  }

  // If not authenticated, return empty - navigation will handle redirect
  if (!session) {
    return null;
  }

  // Show organization switching loading state
  if (isChangingOrg) {
    return (
      <Layout>
        <OrgSwitcherLoading />
      </Layout>
    );
  }

  // Fix the error handling for role upgrade functions - don't pass any parameters
  const handleRoleUpgrade = () => {
    return functionWrappers.handleUpgradeRoleWrapper();
  };
  
  const handleRoleUpgradeRequest = () => {
    return functionWrappers.handleRequestRoleUpgradeWrapper();
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <TeamManagementHeader
          organizations={formattedOrganizations}
          selectedOrgId={selectedOrgId}
          onChange={handleOrganizationChange}
          onRefresh={fetchTeams}
          isLoading={isLoading}
          isChangingOrg={isChangingOrg}
        />
        
        {isExternalOrg && selectedOrganization && (
          <OrganizationAlert 
            orgName={selectedOrganization.name} 
            orgRole={selectedOrganization.role || 'viewer'} 
          />
        )}
        
        <ErrorDisplay 
          error={error} 
          onRetry={selectedTeamId ? refetchTeamMembers : fetchTeams} 
          onUpgradeRole={isViewerOnly ? 
            (canChangeRoles ? handleRoleUpgrade : handleRoleUpgradeRequest) : undefined}
          isViewer={isViewerOnly}
          canDirectlyUpgrade={canChangeRoles}
          isRequestingUpgrade={isRequestingRole}
        />
        
        {isLoading && teams.length === 0 ? (
          <div className="space-y-3">
            <div className="h-10 w-full max-w-xs bg-gray-200 animate-pulse rounded"></div>
            <div className="h-40 w-full bg-gray-200 animate-pulse rounded"></div>
          </div>
        ) : filteredTeams.length > 0 ? (
          <TeamManagementWrapper
            filteredTeams={filteredTeams}
            selectedTeamId={selectedTeamId}
            selectedOrgId={selectedOrgId}
            selectedOrganization={selectedOrganization}
            members={members}
            pendingInvitations={pendingInvitations}
            isLoading={isLoading}
            isLoadingInvitations={isLoadingInvitations}
            isCreatingTeam={isCreatingTeam}
            isUpdatingTeam={isUpdatingTeam}
            isDeletingTeam={isDeletingTeam}
            isRepairingTeam={isRepairingTeam}
            isUpgradingRole={isUpgradingRole}
            isRequestingRole={isRequestingRole}
            isMember={isMember}
            currentUserRole={currentUserRole}
            canChangeRoles={canChangeRoles}
            isChangingOrg={isChangingOrg}
            onSelectTeam={setSelectedTeamId}
            onCreateTeam={functionWrappers.handleCreateTeamWithOrg}
            onUpdateTeam={functionWrappers.handleUpdateTeamWrapper}
            onDeleteTeam={functionWrappers.handleDeleteTeamWrapper}
            onInviteMember={functionWrappers.handleInviteMemberWrapper}
            onChangeRole={functionWrappers.handleChangeRoleWrapper}
            onRemoveMember={functionWrappers.handleRemoveMemberWrapper}
            onResendInvite={handleResendInvite}
            onCancelInvitation={handleCancelInvitation}
            onRepairTeam={functionWrappers.handleRepairTeamWrapper}
            onUpgradeRole={functionWrappers.handleUpgradeRoleWrapper}
            onRequestRoleUpgrade={functionWrappers.handleRequestRoleUpgradeWrapper}
            onFetchPendingInvitations={refetchPendingInvitations}
            getTeamEquipmentCount={getTeamEquipmentCount}
          />
        ) : (
          <EmptyTeamState
            onCreateTeam={functionWrappers.handleCreateTeamWithOrg}
            isCreatingTeam={isCreatingTeam}
            userRole={selectedOrganization?.role || undefined}
            organizationName={selectedOrganization?.name}
          />
        )}
      </div>
    </Layout>
  );
}
