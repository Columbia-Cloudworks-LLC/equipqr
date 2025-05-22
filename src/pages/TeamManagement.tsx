
import { useEffect, useState, useMemo } from 'react';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { ErrorDisplay } from '@/components/Team/ErrorDisplay';
import { EmptyTeamState } from '@/components/Team/EmptyTeamState';
import { Layout } from '@/components/Layout/Layout';
import { TeamContent } from '@/components/Team/TeamContent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/supabase-enums';
import { TeamManagementHeader } from '@/components/Team/TeamManagementHeader';
import { OrganizationAlert } from '@/components/Team/OrganizationAlert';
import { AuthLoadingState } from '@/components/Team/AuthLoadingState';
import { OrgSwitcherLoading } from '@/components/Team/OrgSwitcherLoading';
import { TeamSelectorWithCreate } from '@/components/Team/TeamSelectorWithCreate';
import { useOrganizationSwitch } from '@/hooks/team/useOrganizationSwitch';
import { useFilteredTeams } from '@/hooks/team/useFilteredTeams';
import { useFilteredOrganizations } from '@/hooks/team/useFilteredOrganizations';
import { Organization } from '@/types';
import { UserOrganization } from '@/services/organization/userOrganizations';

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
  const { user, session, isLoading: isAuthLoading } = useAuth();
  
  // Organization and team state management
  const orgSwitchContext = useOrganizationSwitch(fetchTeams, setSelectedTeamId);
  const {
    selectedOrgId,
    isChangingOrg,
    handleOrganizationChange,
    organizations: orgSwitchOrganizations,
    selectedOrganization
  } = orgSwitchContext;
  
  // Filter teams and organizations
  const filteredTeams = useFilteredTeams(teams, selectedOrgId, isChangingOrg);
  
  // Convert UserOrganization[] to Organization[] to match expected types
  const formattedOrganizations: Organization[] = organizations.map(org => ({
    id: org.id,
    name: org.name,
    role: org.role || 'viewer', // Ensure role is always defined
    is_primary: !!org.is_primary,
    created_at: org.created_at,
    updated_at: org.updated_at,
    owner_user_id: org.owner_user_id,
    // Safe assignment since user_id might not exist in UserOrganization
    user_id: (org as any).user_id
  }));

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

  // When filtered teams change, ensure we select a valid team - with improved protection against race conditions
  useEffect(() => {
    // Skip selection changes during organization switching
    if (isChangingOrg) {
      return;
    }
    
    // If there are teams available but none selected or the selected one is invalid
    if (filteredTeams.length > 0) {
      const teamExists = filteredTeams.some(team => team.id === selectedTeamId);
      
      // If no team is selected or the selected team doesn't exist in the filtered list
      if (!selectedTeamId || !teamExists) {
        console.log('Selecting first available team:', filteredTeams[0].id);
        setSelectedTeamId(filteredTeams[0].id);
      }
    } else {
      // Clear selection if no teams available
      if (selectedTeamId) {
        console.log('No teams available, clearing selection');
        setSelectedTeamId('');
      }
    }
  }, [filteredTeams, selectedTeamId, setSelectedTeamId, isChangingOrg]);

  // Determine if the user has viewer role only - check if it's 'viewer' specifically
  const isViewerOnly = isMember && currentUserRole === 'viewer';
  
  // Determine if the user can manage teams in the selected organization
  const canManageTeamsInOrg = selectedOrganization?.role === 'owner' || 
                             selectedOrganization?.role === 'manager' || 
                             selectedOrganization?.role === 'admin';
  
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
      isViewerOnly,
      organizations: organizations.length,
      formattedOrganizations: formattedOrganizations.length,
      isChangingOrg
    });
  }, [teams.length, filteredTeams.length, selectedTeamId, selectedOrgId, isLoading, isMember, 
      currentUserRole, canChangeRoles, isViewerOnly, organizations, formattedOrganizations, isChangingOrg]);

  // Handle team creation with selected organization
  const handleCreateTeamWithOrg = async (name: string) => {
    return handleCreateTeam(name, selectedOrgId);
  };

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
            <div className="h-10 w-full max-w-xs bg-gray-200 animate-pulse rounded"></div>
            <div className="h-40 w-full bg-gray-200 animate-pulse rounded"></div>
          </div>
        ) : filteredTeams.length > 0 ? (
          <>
            <TeamSelectorWithCreate 
              teams={filteredTeams}
              selectedTeamId={selectedTeamId}
              onSelectTeam={setSelectedTeamId}
              onCreateTeam={handleCreateTeamWithOrg}
              isCreatingTeam={isCreatingTeam}
              isChangingOrg={isChangingOrg}
              showCreateButton={canManageTeamsInOrg}
            />
            
            {selectedTeamId ? (
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
            ) : (
              <div className="mt-6 text-center p-6 border border-dashed rounded-lg">
                <p>Select a team from the dropdown above</p>
              </div>
            )}
          </>
        ) : (
          <EmptyTeamState
            onCreateTeam={handleCreateTeamWithOrg}
            isCreatingTeam={isCreatingTeam}
            userRole={selectedOrganization?.role || undefined}
            organizationName={selectedOrganization?.name}
          />
        )}
      </div>
    </Layout>
  );
}
