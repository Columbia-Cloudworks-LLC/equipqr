
import { useEffect } from 'react';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { TeamSelector } from '@/components/Team/TeamSelector';
import { TeamContent } from '@/components/Team/TeamContent';
import { ErrorDisplay } from '@/components/Team/ErrorDisplay';
import { EmptyTeamState } from '@/components/Team/EmptyTeamState';
import { Layout } from '@/components/Layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTeamButton } from '@/components/Team/CreateTeamButton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function TeamManagement() {
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
  const { user, session, isLoading: isAuthLoading } = useAuth();

  // Authentication check
  useEffect(() => {
    // Only check after auth loading is complete
    if (!isAuthLoading && !session) {
      navigate('/auth', { 
        state: { 
          returnTo: '/teams',
          message: 'You need to sign in to access Team Management'
        } 
      });
    }
  }, [session, isAuthLoading, navigate]);

  // Determine if the user has viewer role only - check if it's 'viewer' specifically
  const isViewerOnly = isMember && currentUserRole === 'viewer';
  
  // Log state for debugging
  useEffect(() => {
    console.log('TeamManagement render:', {
      teamsCount: teams.length,
      selectedTeamId,
      isLoading,
      isMember,
      currentUserRole,
      canChangeRoles,
      isViewerOnly
    });
  }, [teams.length, selectedTeamId, isLoading, isMember, currentUserRole, canChangeRoles, isViewerOnly]);

  // Show loading state during auth check
  if (isAuthLoading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  // If not authenticated, return empty - navigation will handle redirect
  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Team Management</h1>
          <Button variant="outline" size="sm" onClick={fetchTeams} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        
        <ErrorDisplay 
          error={error} 
          onRetry={selectedTeamId ? refetchTeamMembers : fetchTeams} 
          onUpgradeRole={isViewerOnly ? 
            (canChangeRoles ? 
              () => handleUpgradeRole(selectedTeamId) : 
              () => handleRequestRoleUpgrade(selectedTeamId)
            ) : undefined}
          isViewer={isViewerOnly}
          canDirectlyUpgrade={canChangeRoles}
          isRequestingUpgrade={isRequestingRole}
        />
        
        {isLoading && teams.length === 0 ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full max-w-xs" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : teams.length > 0 ? (
          <>
            <div className="flex items-center">
              <div className="max-w-xs flex-1">
                <TeamSelector 
                  teams={teams}
                  value={selectedTeamId}
                  onChange={setSelectedTeamId}
                  placeholder="Select a team to manage"
                  hideNoTeamOption={true}
                />
              </div>
              
              {/* Add Create Team Button - only shown for users who can manage teams */}
              {(currentUserRole === 'owner' || currentUserRole === 'manager' || canChangeRoles) && (
                <CreateTeamButton 
                  onCreateTeam={handleCreateTeam}
                  isCreating={isCreatingTeam}
                />
              )}
            </div>
            
            <TeamContent
              selectedTeamId={selectedTeamId}
              members={members}
              pendingInvitations={pendingInvitations}
              teams={teams}
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
              onInviteMember={handleInviteMember}
              onChangeRole={handleChangeRole}
              onRemoveMember={handleRemoveMember}
              onResendInvite={handleResendInvite}
              onCancelInvitation={handleCancelInvitation}
              onCreateTeam={handleCreateTeam}
              onUpdateTeam={handleUpdateTeam}
              onDeleteTeam={handleDeleteTeam}
              onRepairTeam={handleRepairTeam}
              onUpgradeRole={handleUpgradeRole}
              onRequestRoleUpgrade={handleRequestRoleUpgrade}
              onFetchPendingInvitations={refetchPendingInvitations}
              getTeamEquipmentCount={getTeamEquipmentCount}
            />
          </>
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
