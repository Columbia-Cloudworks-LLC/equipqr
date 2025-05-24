
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
  handleUpdateTeam: (teamId: string, data: { name: string }) => Promise<any>,
  handleDeleteTeam: (teamId: string) => Promise<any>,
  handleRepairTeam: () => Promise<void>,
  handleUpgradeRole: () => Promise<void>,
  handleRequestRoleUpgrade: () => Promise<void>
) {
  const handleInviteMemberWrapper = useCallback(async (email: string, role: UserRole) => {
    return handleInviteMember(email, role, selectedTeamId);
  }, [handleInviteMember, selectedTeamId]);

  const handleChangeRoleWrapper = useCallback(async (userId: string, role: UserRole) => {
    return handleChangeRole(userId, role);
  }, [handleChangeRole]);

  const handleRemoveMemberWrapper = useCallback(async (userId: string) => {
    return handleRemoveMember(userId);
  }, [handleRemoveMember]);

  const handleCreateTeamWithOrg = useCallback(async (name: string) => {
    return handleCreateTeam(name);
  }, [handleCreateTeam]);

  const handleUpdateTeamWrapper = useCallback(async (teamId: string, data: { name: string }) => {
    return handleUpdateTeam(teamId, data);
  }, [handleUpdateTeam]);

  // Fixed wrapper that matches the expected signature
  const handleUpdateTeamWrapperFixed = useCallback(async (teamId: string, data: { name: string }) => {
    return handleUpdateTeam(teamId, data);
  }, [handleUpdateTeam]);

  const handleDeleteTeamWrapper = useCallback(async (teamId: string) => {
    return handleDeleteTeam(teamId);
  }, [handleDeleteTeam]);

  const handleRepairTeamWrapper = useCallback(async () => {
    return handleRepairTeam();
  }, [handleRepairTeam]);

  const handleUpgradeRoleWrapper = useCallback(async () => {
    return handleUpgradeRole();
  }, [handleUpgradeRole]);

  const handleRequestRoleUpgradeWrapper = useCallback(async () => {
    return handleRequestRoleUpgrade();
  }, [handleRequestRoleUpgrade]);

  return {
    handleInviteMemberWrapper,
    handleChangeRoleWrapper,
    handleRemoveMemberWrapper,
    handleCreateTeamWithOrg,
    handleUpdateTeamWrapper,
    handleUpdateTeamWrapperFixed,
    handleDeleteTeamWrapper,
    handleRepairTeamWrapper,
    handleUpgradeRoleWrapper,
    handleRequestRoleUpgradeWrapper
  };
}
