
import { useCallback } from 'react';
import { UserRole } from '@/types/supabase-enums';

export function useTeamFunctionWrappers(
  selectedTeamId: string | null,
  selectedOrgId: string,
  handleInviteMember: (email: string, role: UserRole, teamId: string) => Promise<any>,
  handleChangeRole: (userId: string, role: UserRole) => Promise<any>,
  handleRemoveMember: (userId: string) => Promise<any>,
  handleResendInvite: (id: string) => Promise<void>,
  handleCancelInvitation: (id: string) => Promise<void>,
  handleCreateTeam: (name: string, orgId?: string) => Promise<any>,
  handleUpdateTeam: (id: string, name: string) => Promise<any>,
  handleDeleteTeam: (teamId: string) => Promise<any>,
  handleRepairTeam: (teamId: string) => Promise<void>,
  handleUpgradeRole: (teamId: string) => Promise<void>,
  handleRequestRoleUpgrade: (teamId: string) => Promise<void>
) {
  
  // Enhanced team creation with proper organization context
  const handleCreateTeamWithOrg = useCallback(async (name: string) => {
    console.log(`Creating team "${name}" for organization ${selectedOrgId}`);
    
    if (!selectedOrgId) {
      throw new Error('No organization selected');
    }
    
    return handleCreateTeam(name, selectedOrgId);
  }, [handleCreateTeam, selectedOrgId]);

  // Enhanced wrappers with organization context logging
  const handleInviteMemberWrapper = useCallback(async (email: string, role: UserRole) => {
    if (!selectedTeamId) {
      throw new Error('No team selected');
    }
    
    console.log(`Inviting member ${email} with role ${role} to team ${selectedTeamId} in org ${selectedOrgId}`);
    return handleInviteMember(email, role, selectedTeamId);
  }, [handleInviteMember, selectedTeamId, selectedOrgId]);

  const handleChangeRoleWrapper = useCallback(async (userId: string, role: UserRole) => {
    console.log(`Changing role for user ${userId} to ${role} in team ${selectedTeamId} (org: ${selectedOrgId})`);
    return handleChangeRole(userId, role);
  }, [handleChangeRole, selectedTeamId, selectedOrgId]);

  const handleRemoveMemberWrapper = useCallback(async (userId: string) => {
    console.log(`Removing member ${userId} from team ${selectedTeamId} (org: ${selectedOrgId})`);
    return handleRemoveMember(userId);
  }, [handleRemoveMember, selectedTeamId, selectedOrgId]);

  const handleUpdateTeamWrapper = useCallback(async (id: string, name: string) => {
    console.log(`Updating team ${id} name to "${name}" in org ${selectedOrgId}`);
    return handleUpdateTeam(id, name);
  }, [handleUpdateTeam, selectedOrgId]);

  const handleDeleteTeamWrapper = useCallback(async (teamId: string) => {
    console.log(`Deleting team ${teamId} from org ${selectedOrgId}`);
    return handleDeleteTeam(teamId);
  }, [handleDeleteTeam, selectedOrgId]);

  // Updated wrappers that handle teamId internally
  const handleRepairTeamWrapper = useCallback(async () => {
    if (!selectedTeamId) {
      throw new Error('No team selected');
    }
    console.log(`Repairing team access for team ${selectedTeamId} in org ${selectedOrgId}`);
    return handleRepairTeam(selectedTeamId);
  }, [handleRepairTeam, selectedTeamId, selectedOrgId]);

  const handleUpgradeRoleWrapper = useCallback(async () => {
    if (!selectedTeamId) {
      throw new Error('No team selected');
    }
    console.log(`Upgrading role for team ${selectedTeamId} in org ${selectedOrgId}`);
    return handleUpgradeRole(selectedTeamId);
  }, [handleUpgradeRole, selectedTeamId, selectedOrgId]);

  const handleRequestRoleUpgradeWrapper = useCallback(async () => {
    if (!selectedTeamId) {
      throw new Error('No team selected');
    }
    console.log(`Requesting role upgrade for team ${selectedTeamId} in org ${selectedOrgId}`);
    return handleRequestRoleUpgrade(selectedTeamId);
  }, [handleRequestRoleUpgrade, selectedTeamId, selectedOrgId]);

  return {
    handleCreateTeamWithOrg,
    handleInviteMemberWrapper,
    handleChangeRoleWrapper,
    handleRemoveMemberWrapper,
    handleUpdateTeamWrapper,
    handleDeleteTeamWrapper,
    handleRepairTeamWrapper,
    handleUpgradeRoleWrapper,
    handleRequestRoleUpgradeWrapper
  };
}
