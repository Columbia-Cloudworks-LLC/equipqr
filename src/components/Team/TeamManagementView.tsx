
import { ErrorDisplay } from '@/components/Team/ErrorDisplay';
import { EmptyTeamState } from '@/components/Team/EmptyTeamState';
import { TeamManagementHeader } from '@/components/Team/TeamManagementHeader';
import { OrganizationAlert } from '@/components/Team/OrganizationAlert';
import { AuthLoadingState } from '@/components/Team/AuthLoadingState';
import { TeamManagementWrapper } from '@/components/Team/TeamManagementWrapper';
import { useTeamManagementContext } from '@/contexts/TeamManagementContext';

export function TeamManagementView() {
  const {
    members,
    pendingInvitations,
    filteredTeams,
    selectedTeamId,
    selectedOrganization,
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
    handleDeleteTeam,
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
  } = useTeamManagementContext();

  // Determine if the user has viewer role only
  const isViewerOnly = isMember && currentUserRole === 'viewer';

  // Check if we're viewing an external organization's teams
  const isExternalOrg = selectedOrganization && !selectedOrganization.is_primary;

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
        onRefresh={fetchTeams}
        isLoading={isLoading}
        selectedOrganization={selectedOrganization}
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
          (canChangeRoles ? handleUpgradeRole : handleRequestRoleUpgrade) : undefined}
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
          selectedOrganization={selectedOrganization}
          members={members}
          pendingInvitations={pendingInvitations}
          isLoading={isLoading}
          isLoadingInvitations={isLoadingInvitations}
          isCreatingTeam={isCreatingTeam}
          isUpdatingTeam={isUpdatingTeam}
          isDeletingTeam={isDeletingTeam}
          isUpgradingRole={isUpgradingRole}
          isRequestingRole={isRequestingRole}
          isMember={isMember}
          currentUserRole={currentUserRole}
          canChangeRoles={canChangeRoles}
          isChangingOrg={false}
          onSelectTeam={setSelectedTeamId}
          onCreateTeam={handleCreateTeam}
          onUpdateTeam={handleUpdateTeam}
          onDeleteTeam={handleDeleteTeam}
          onInviteMember={handleInviteMember}
          onChangeRole={handleChangeRole}
          onRemoveMember={handleRemoveMember}
          onResendInvite={handleResendInvite}
          onCancelInvitation={handleCancelInvitation}
          onUpgradeRole={handleUpgradeRole}
          onRequestRoleUpgrade={handleRequestRoleUpgrade}
          onFetchPendingInvitations={refetchPendingInvitations}
          getTeamEquipmentCount={getTeamEquipmentCount}
        />
      ) : (
        <EmptyTeamState
          onCreateTeam={handleCreateTeam}
          isCreatingTeam={isCreatingTeam}
          userRole={selectedOrganization?.role || undefined}
          organizationName={selectedOrganization?.name}
        />
      )}
    </div>
  );
}
