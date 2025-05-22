
import { useCallback } from 'react';
import { UserRole } from '@/types/supabase-enums';

export function useTeamFunctionWrappers(
  selectedTeamId: string,
  handleInviteMember: (email: string, role: UserRole, teamId: string) => Promise<any>,
  handleChangeRole: (userId: string, role: UserRole) => Promise<any>,
  handleRemoveMember: (userId: string) => Promise<any>,
  handleResendInvite: (id: string) => Promise<void>,
  handleCancelInvitation: (id: string) => Promise<void>,
  handleCreateTeam: (name: string, orgId: string) => Promise<any>,
  handleUpdateTeam: (id: string, name: string) => Promise<any>,
  handleDeleteTeam: (teamId: string) => Promise<void>,
  handleRepairTeam: (teamId: string) => Promise<void>,
  handleUpgradeRole: (teamId: string) => Promise<void>,
  handleRequestRoleUpgrade: (teamId: string) => Promise<void>
) {
  // Wrapper for team creation with org context
  const handleCreateTeamWithOrg = useCallback(async (name: string) => {
    return handleCreateTeam(name, selectedTeamId);
  }, [handleCreateTeam, selectedTeamId]);

  // Wrapper for team update
  const handleUpdateTeamWrapper = useCallback(async (id: string, name: string): Promise<any> => {
    return handleUpdateTeam(id, name);
  }, [handleUpdateTeam]);
  
  // Wrapper for team deletion
  const handleDeleteTeamWrapper = useCallback(async (teamId: string): Promise<void> => {
    await handleDeleteTeam(teamId);
  }, [handleDeleteTeam]);
  
  // Wrapper for team repair
  const handleRepairTeamWrapper = useCallback(async (): Promise<void> => {
    await handleRepairTeam(selectedTeamId);
  }, [handleRepairTeam, selectedTeamId]);
  
  // Wrapper for role upgrade
  const handleUpgradeRoleWrapper = useCallback(async (): Promise<void> => {
    await handleUpgradeRole(selectedTeamId);
  }, [handleUpgradeRole, selectedTeamId]);
  
  // Wrapper for role upgrade request
  const handleRequestRoleUpgradeWrapper = useCallback(async (): Promise<void> => {
    await handleRequestRoleUpgrade(selectedTeamId);
  }, [handleRequestRoleUpgrade, selectedTeamId]);

  // Wrapper for member invitation - FIXED to match expected parameter structure
  const handleInviteMemberWrapper = useCallback((email: string, role: UserRole): Promise<any> => {
    return handleInviteMember(email, role, selectedTeamId);
  }, [handleInviteMember, selectedTeamId]);
  
  // Wrapper for role change
  const handleChangeRoleWrapper = useCallback(async (userId: string, role: UserRole): Promise<any> => {
    return handleChangeRole(userId, role);
  }, [handleChangeRole]);
  
  // Wrapper for member removal
  const handleRemoveMemberWrapper = useCallback(async (userId: string): Promise<any> => {
    return handleRemoveMember(userId);
  }, [handleRemoveMember]);

  return {
    handleCreateTeamWithOrg,
    handleUpdateTeamWrapper,
    handleDeleteTeamWrapper,
    handleRepairTeamWrapper,
    handleUpgradeRoleWrapper,
    handleRequestRoleUpgradeWrapper,
    handleInviteMemberWrapper,
    handleChangeRoleWrapper,
    handleRemoveMemberWrapper
  };
}
