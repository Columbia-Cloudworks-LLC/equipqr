
import { useState, useEffect } from 'react';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { TeamSelector } from '@/components/Team/TeamSelector';
import { TeamContent } from '@/components/Team/TeamContent';
import { ErrorDisplay } from '@/components/Team/ErrorDisplay';
import { EmptyTeamState } from '@/components/Team/EmptyTeamState';
import { Layout } from '@/components/Layout/Layout';

export default function TeamManagement() {
  const {
    members,
    pendingInvitations,
    teams,
    selectedTeamId,
    isLoading,
    isLoadingInvitations,
    isCreatingTeam,
    isRepairingTeam,
    isMember,
    isUpgradingRole,
    isRequestingRole,
    currentUserRole,
    canChangeRoles,
    error,
    setSelectedTeamId,
    handleCreateTeam,
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
  } = useTeamManagement();

  // Determine if the user has viewer role only
  const isViewerOnly = isMember && currentUserRole === 'viewer';

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        
        <ErrorDisplay 
          error={error} 
          onRetry={selectedTeamId ? refetchTeamMembers : undefined} 
          onUpgradeRole={isViewerOnly ? 
            (canChangeRoles ? 
              () => handleUpgradeRole(selectedTeamId) : 
              () => handleRequestRoleUpgrade(selectedTeamId)
            ) : undefined}
          isViewer={isViewerOnly}
          canDirectlyUpgrade={canChangeRoles}
          isRequestingUpgrade={isRequestingRole}
        />
        
        {teams.length > 0 ? (
          <>
            <div className="max-w-xs">
              <TeamSelector 
                teams={teams}
                value={selectedTeamId}
                onChange={setSelectedTeamId}
                placeholder="Select a team to manage"
              />
            </div>
            
            <TeamContent
              selectedTeamId={selectedTeamId}
              members={members}
              pendingInvitations={pendingInvitations}
              teams={teams}
              isLoading={isLoading}
              isLoadingInvitations={isLoadingInvitations}
              isCreatingTeam={isCreatingTeam}
              isRepairingTeam={isRepairingTeam}
              isUpgradingRole={isUpgradingRole}
              isRequestingRole={isRequestingRole}
              isMember={isMember}
              currentUserRole={currentUserRole}
              canChangeRoles={canChangeRoles}
              onInviteMember={handleInviteMember}
              onChangeRole={handleChangeRole}
              onRemoveMember={handleRemoveMember}
              onResendInvite={handleResendInvite}
              onCancelInvitation={handleCancelInvitation}
              onCreateTeam={handleCreateTeam}
              onRepairTeam={handleRepairTeam}
              onUpgradeRole={handleUpgradeRole}
              onRequestRoleUpgrade={handleRequestRoleUpgrade}
              onFetchPendingInvitations={refetchPendingInvitations}
            />
          </>
        ) : isLoading ? (
          <p>Loading teams...</p>
        ) : (
          <EmptyTeamState
            onCreateTeam={handleCreateTeam}
            isCreatingTeam={isCreatingTeam}
          />
        )}
      </div>
    </Layout>
  );
}
