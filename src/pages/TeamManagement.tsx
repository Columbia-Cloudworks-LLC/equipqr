
import { useState, useEffect } from 'react';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { TeamSelector } from '@/components/Team/TeamSelector';
import { TeamContent } from '@/components/Team/TeamContent';
import { ErrorDisplay } from '@/components/Team/ErrorDisplay';
import { EmptyTeamState } from '@/components/Team/EmptyTeamState';
import { Layout } from '@/components/Layout/Layout';
import { upgradeToManagerRole } from '@/services/team/memberService';
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
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>(undefined);

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

  // Handle role upgrade
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
          onUpgradeRole={isViewerOnly ? () => handleUpgradeRole(selectedTeamId) : undefined}
          isViewer={isViewerOnly}
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
              isMember={isMember}
              currentUserRole={currentUserRole}
              onInviteMember={handleInviteMember}
              onChangeRole={handleChangeRole}
              onRemoveMember={handleRemoveMember}
              onResendInvite={handleResendInvite}
              onCreateTeam={handleCreateTeam}
              onRepairTeam={handleRepairTeam}
              onUpgradeRole={handleUpgradeRole}
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
