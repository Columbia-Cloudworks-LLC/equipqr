
import { useCallback } from 'react';
import { UserRole } from '@/types/supabase-enums';

export function useTeamFunctionWrappers(
  selectedTeamId: string,
  selectedOrgId: string,
  handleInviteMember: (email: string, role: UserRole, teamId: string) => Promise<any>,
  handleChangeRole: (userId: string, role: string) => Promise<any>,
  handleRemoveMember: (userId: string) => Promise<any>,
  handleResendInvite: (id: string) => Promise<void>,
  handleCancelInvitation: (id: string) => Promise<void>,
  handleCreateTeam: (name: string) => Promise<any>,
  handleUpdateTeam: (id: string, name: string) => Promise<any>,
  handleDeleteTeam: (teamId: string) => Promise<any>,
  handleRepairTeam: (teamId: string) => Promise<any>,
  handleUpgradeRole: () => Promise<void>,
  handleRequestRoleUpgrade: () => Promise<void>
) {
  const handleInviteMemberWrapper = useCallback(async (email: string, role: UserRole): Promise<any> => {
    return handleInviteMember(email, role, selectedTeamId);
  }, [handleInviteMember, selectedTeamId]);

  const handleChangeRoleWrapper = useCallback(async (userId: string, role: UserRole): Promise<any> => {
    return handleChangeRole(userId, role);
  }, [handleChangeRole]);

  const handleRemoveMemberWrapper = useCallback(async (userId: string): Promise<any> => {
    return handleRemoveMember(userId);
  }, [handleRemoveMember]);

  const handleCreateTeamWithOrg = useCallback(async (name: string): Promise<any> => {
    return handleCreateTeam(name);
  }, [handleCreateTeam]);

  const handleUpdateTeamWrapper = useCallback(async (teamId: string, data: { name: string }): Promise<any> => {
    return handleUpdateTeam(teamId, data.name);
  }, [handleUpdateTeam]);

  // New wrapper for context - takes (id, name) and converts to (id, { name })
  const handleUpdateTeamContextWrapper = useCallback(async (id: string, name: string): Promise<any> => {
    return handleUpdateTeam(id, name);
  }, [handleUpdateTeam]);

  const handleDeleteTeamWrapper = useCallback(async (teamId: string): Promise<any> => {
    return handleDeleteTeam(teamId);
  }, [handleDeleteTeam]);

  // Fixed: This wrapper now has the correct zero-parameter signature with proper return type
  const handleRepairTeamWrapper = useCallback(async (): Promise<any> => {
    try {
      if (!selectedTeamId) {
        throw new Error('No team selected for repair');
      }
      return await handleRepairTeam(selectedTeamId);
    } catch (error) {
      console.error('Error in handleRepairTeamWrapper:', error);
      throw error;
    }
  }, [handleRepairTeam, selectedTeamId]);

  const handleUpgradeRoleWrapper = useCallback(async (): Promise<any> => {
    return handleUpgradeRole();
  }, [handleUpgradeRole]);

  const handleRequestRoleUpgradeWrapper = useCallback(async (): Promise<any> => {
    return handleRequestRoleUpgrade();
  }, [handleRequestRoleUpgrade]);

  return {
    handleInviteMemberWrapper,
    handleChangeRoleWrapper,
    handleRemoveMemberWrapper,
    handleCreateTeamWithOrg,
    handleUpdateTeamWrapper,
    handleUpdateTeamContextWrapper,
    handleDeleteTeamWrapper,
    handleRepairTeamWrapper,
    handleUpgradeRoleWrapper,
    handleRequestRoleUpgradeWrapper
  };
}
