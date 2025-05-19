
import { useEffect, useState } from 'react';
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
import { UserRole } from '@/types/supabase-enums';
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function TeamManagement() {
  const { organizations, selectedOrganization, selectOrganization } = useOrganization();
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
    selectedOrganization?.id
  );

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

  // Track if viewing external organization teams
  const isExternalOrg = selectedOrganization && !selectedOrganization.is_primary;

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

  // Update organization context when selectedOrgId changes
  useEffect(() => {
    if (selectedOrgId && selectedOrgId !== selectedOrganization?.id) {
      selectOrganization(selectedOrgId);
    }
  }, [selectedOrgId, selectOrganization, selectedOrganization]);

  // Update selectedOrgId when selectedOrganization changes
  useEffect(() => {
    if (selectedOrganization && selectedOrgId !== selectedOrganization.id) {
      setSelectedOrgId(selectedOrganization.id);
    }
  }, [selectedOrganization]);

  // Filter teams by selected organization
  const filteredTeams = selectedOrgId 
    ? teams.filter(team => team.organizationId === selectedOrgId) 
    : teams;

  // Determine if the user has viewer role only - check if it's 'viewer' specifically
  const isViewerOnly = isMember && currentUserRole === 'viewer';
  
  // Log state for debugging
  useEffect(() => {
    console.log('TeamManagement render:', {
      teamsCount: teams.length,
      filteredTeamsCount: filteredTeams.length,
      selectedTeamId,
      selectedOrgId,
      isLoading,
      isMember,
      currentUserRole,
      canChangeRoles,
      isViewerOnly
    });
  }, [teams.length, filteredTeams.length, selectedTeamId, selectedOrgId, isLoading, isMember, currentUserRole, canChangeRoles, isViewerOnly]);

  // Wrapper functions to adapt the hook functions to the expected return types for TeamContent
  const handleUpdateTeamWrapper = async (id: string, name: string): Promise<void> => {
    await handleUpdateTeam(id, name);
  };
  
  const handleDeleteTeamWrapper = async (teamId: string): Promise<void> => {
    await handleDeleteTeam(teamId);
  };
  
  const handleRepairTeamWrapper = async (teamId: string): Promise<void> => {
    await handleRepairTeam(teamId);
  };
  
  const handleUpgradeRoleWrapper = async (teamId: string): Promise<void> => {
    await handleUpgradeRole(teamId);
  };
  
  const handleRequestRoleUpgradeWrapper = async (teamId: string): Promise<void> => {
    await handleRequestRoleUpgrade(teamId);
  };

  // Wrapper functions to adapt argument patterns for TeamContent props
  const handleInviteMemberWrapper = async (data: any): Promise<any> => {
    // Expected data format: { email: string, role: UserRole, teamId: string }
    if (data && data.email && data.role && data.teamId) {
      return handleInviteMember(data.email, data.role, data.teamId);
    } else if (typeof data === 'string' && selectedTeamId) {
      // Fallback for simple email string format
      return handleInviteMember(data, 'viewer' as UserRole, selectedTeamId);
    }
    console.error("Invalid data format for invite member", data);
    return Promise.reject("Invalid invite member data format");
  };
  
  const handleChangeRoleWrapper = async (userId: string, role: string): Promise<any> => {
    if (selectedTeamId) {
      return handleChangeRole(userId, role as UserRole, selectedTeamId);
    }
    return Promise.reject("No team selected");
  };
  
  const handleRemoveMemberWrapper = async (userId: string): Promise<any> => {
    if (selectedTeamId) {
      return handleRemoveMember(userId, selectedTeamId);
    }
    return Promise.reject("No team selected");
  };

  // Handle organization change
  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    // Clear selected team when changing org
    setSelectedTeamId('');
  };

  // Handle team creation with selected organization
  const handleCreateTeamWithOrg = async (name: string) => {
    return handleCreateTeam(name, selectedOrgId);
  };

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold">Team Management</h1>
          <div className="flex items-center gap-2">
            {organizations.length > 1 && (
              <OrganizationSelector
                organizations={organizations}
                selectedOrgId={selectedOrgId}
                onChange={handleOrganizationChange}
                className="w-[200px]"
              />
            )}
            <Button variant="outline" size="sm" onClick={fetchTeams} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
        
        {isExternalOrg && (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4" />
            <AlertTitle>External Organization</AlertTitle>
            <AlertDescription>
              You are managing teams in {selectedOrganization?.name} where you have {selectedOrganization?.role} access.
            </AlertDescription>
          </Alert>
        )}
        
        <ErrorDisplay 
          error={error} 
          onRetry={selectedTeamId ? refetchTeamMembers : fetchTeams} 
          onUpgradeRole={isViewerOnly ? 
            (canChangeRoles ? 
              () => handleUpgradeRoleWrapper(selectedTeamId) : 
              () => handleRequestRoleUpgradeWrapper(selectedTeamId)
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
        ) : filteredTeams.length > 0 ? (
          <>
            <div className="flex items-center">
              <div className="max-w-xs flex-1">
                <TeamSelector 
                  teams={filteredTeams}
                  value={selectedTeamId}
                  onChange={setSelectedTeamId}
                  placeholder="Select a team to manage"
                  hideNoTeamOption={true}
                />
              </div>
              
              {/* Add Create Team Button - only shown for users who can manage teams */}
              {(currentUserRole === 'owner' || currentUserRole === 'manager' || canChangeRoles) && (
                <CreateTeamButton 
                  onCreateTeam={handleCreateTeamWithOrg}
                  isCreating={isCreatingTeam}
                />
              )}
            </div>
            
            <TeamContent
              selectedTeamId={selectedTeamId}
              members={members}
              pendingInvitations={pendingInvitations}
              teams={filteredTeams}
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
              onInviteMember={handleInviteMemberWrapper}
              onChangeRole={handleChangeRoleWrapper}
              onRemoveMember={handleRemoveMemberWrapper}
              onResendInvite={handleResendInvite}
              onCancelInvitation={handleCancelInvitation}
              onCreateTeam={handleCreateTeamWithOrg}
              onUpdateTeam={handleUpdateTeamWrapper}
              onDeleteTeam={handleDeleteTeamWrapper}
              onRepairTeam={handleRepairTeamWrapper}
              onUpgradeRole={handleUpgradeRoleWrapper}
              onRequestRoleUpgrade={handleRequestRoleUpgradeWrapper}
              onFetchPendingInvitations={refetchPendingInvitations}
              getTeamEquipmentCount={getTeamEquipmentCount}
            />
          </>
        ) : (
          <EmptyTeamState
            onCreateTeam={handleCreateTeamWithOrg}
            isCreatingTeam={isCreatingTeam}
          />
        )}
      </div>
    </Layout>
  );
}
