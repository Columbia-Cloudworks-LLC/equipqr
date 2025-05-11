
import { useState, useEffect } from 'react';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { TeamSelector } from '@/components/Team/TeamSelector';
import { TeamContent } from '@/components/Team/TeamContent';
import { ErrorDisplay } from '@/components/Team/ErrorDisplay';
import { EmptyTeamState } from '@/components/Team/EmptyTeamState';
import { Layout } from '@/components/Layout/Layout';
import { upgradeToManagerRole, requestRoleUpgrade, checkRoleChangePermission } from '@/services/team/memberService';
import { toast } from 'sonner';

export default function TeamManagement() {
  const {
    members,
    teams,
    selectedTeamId,
    isLoading,
    isCreatingTeam,
    isRepairingTeam,
    isMember,
    error,
    setSelectedTeamId,
    handleCreateTeam,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleRepairTeam,
    refetchTeamMembers,
  } = useTeamManagement();

  const [isUpgradingRole, setIsUpgradingRole] = useState(false);
  const [isRequestingRole, setIsRequestingRole] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>(undefined);
  const [canChangeRoles, setCanChangeRoles] = useState(false);

  // Determine the current user's role in the selected team
  useEffect(() => {
    if (members?.length > 0) {
      import('@/integrations/supabase/client').then(({ supabase }) => {
        // Get current user and find their role
        supabase.auth.getSession().then(({ data }) => {
          const authUserId = data.session?.user?.id;
          if (authUserId) {
            // Find the member that corresponds to current user
            const currentMember = members.find(m => m.auth_uid === authUserId);
            if (currentMember) {
              setCurrentUserRole(currentMember.role);
              console.log('Current user role:', currentMember.role);
            }
          }
        });
      });
    }
  }, [members]);

  // Check if user has permission to manage roles
  useEffect(() => {
    const checkPermission = async () => {
      if (selectedTeamId) {
        try {
          const hasPermission = await checkRoleChangePermission(selectedTeamId);
          setCanChangeRoles(hasPermission);
        } catch (error) {
          console.error("Error checking role permission:", error);
          setCanChangeRoles(false);
        }
      }
    };
    
    checkPermission();
  }, [selectedTeamId, currentUserRole]);

  // Handle role upgrade request
  const handleRequestRoleUpgrade = async (teamId: string) => {
    try {
      setIsRequestingRole(true);
      const result = await requestRoleUpgrade(teamId);
      toast.success("Role upgrade requested", {
        description: result.message,
      });
    } catch (error: any) {
      toast.error("Error requesting role upgrade", {
        description: error.message,
      });
    } finally {
      setIsRequestingRole(false);
    }
  };

  // Handle direct role upgrade (for users with permission)
  const handleUpgradeRole = async (teamId: string) => {
    try {
      setIsUpgradingRole(true);
      await upgradeToManagerRole(teamId);
      toast.success("Role upgraded successfully", {
        description: "You are now a team manager",
      });
      // Refetch members to update UI
      refetchTeamMembers();
      setCurrentUserRole('manager');
    } catch (error: any) {
      toast.error("Error upgrading role", {
        description: error.message,
      });
    } finally {
      setIsUpgradingRole(false);
    }
  };

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
              teams={teams}
              isLoading={isLoading}
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
              onCreateTeam={handleCreateTeam}
              onRepairTeam={handleRepairTeam}
              onUpgradeRole={handleUpgradeRole}
              onRequestRoleUpgrade={handleRequestRoleUpgrade}
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
