
import { ErrorDisplay } from '@/components/Team/ErrorDisplay';
import { EmptyTeamState } from '@/components/Team/EmptyTeamState';
import { TeamManagementHeader } from '@/components/Team/TeamManagementHeader';
import { OrganizationAlert } from '@/components/Team/OrganizationAlert';
import { AuthLoadingState } from '@/components/Team/AuthLoadingState';
import { OrgSwitcherLoading } from '@/components/Team/OrgSwitcherLoading';
import { TeamManagementWrapper } from '@/components/Team/TeamManagementWrapper';
import { useTeamManagementContext } from '@/contexts/TeamManagementContext';
import { UserRole } from '@/types/supabase-enums';
import { useTeamFunctionWrappers } from '@/hooks/team/useTeamFunctionWrappers';

export function TeamManagementView() {
  const {
    members,
    pendingInvitations,
    filteredTeams,
    selectedTeamId,
    selectedOrgId,
    selectedOrganization,
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
  } = useTeamManagementContext();

  // Function wrappers for team operations
  const functionWrappers = useTeamFunctionWrappers(
    selectedTeamId,
    selectedOrgId || '',
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    handleRepairTeam,
    handleUpgradeRole,
    handleRequestRoleUpgrade
  );
  
  // Determine if the user has viewer role only
  const isViewerOnly = isMember && currentUserRole === 'viewer';

  // Check if we're in the middle of an organization change
  if (isChangingOrg) {
    return <OrgSwitcherLoading />;
  }

  // Check if we're viewing an external organization's teams
  const isExternalOrg = selectedOrganization && !selectedOrganization.is_primary;

  // Fixed wrapper functions that properly handle parameters
  const handleRoleUpgrade = () => {
    if (selectedTeamId) {
      return functionWrappers.handleUpgradeRoleWrapper();
    }
    return Promise.resolve();
  };
  
  const handleRoleUpgradeRequest = () => {
    if (selectedTeamId) {
      return functionWrappers.handleRequestRoleUpgradeWrapper();
    }
    return Promise.resolve();
  };

  // Fix the retry function to not pass parameters
  const handleRetry = () => {
    if (selectedTeamId) {
      refetchTeamMembers();
    } else {
      fetchTeams();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <TeamManagementHeader
        organizations={organizations}
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
        onRetry={handleRetry}
        onUpgradeRole={isViewerOnly ? 
          (canChangeRoles ? handleRoleUpgrade : handleRoleUpgradeRequest) : undefined}
        isViewer={isViewerOnly}
        canDirectlyUpgrade={canChangeRoles}
        isRequestingUpgrade={isRequestingRole}
      />
      
      {isLoading && filteredTeams.length === 0 ? (
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
  );
}
