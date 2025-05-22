
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
  handleUpdateTeam: (id: string, name: string) => Promise<void>,
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
  const handleUpdateTeamWrapper = useCallback(async (id: string, name: string): Promise<void> => {
    await handleUpdateTeam(id, name);
  }, [handleUpdateTeam]);
  
  // Wrapper for team deletion
  const handleDeleteTeamWrapper = useCallback(async (teamId: string): Promise<void> => {
    await handleDeleteTeam(teamId);
  }, [handleDeleteTeam]);
  
  // Wrapper for team repair
  const handleRepairTeamWrapper = useCallback(async (teamId: string): Promise<void> => {
    await handleRepairTeam(teamId);
  }, [handleRepairTeam]);
  
  // Wrapper for role upgrade
  const handleUpgradeRoleWrapper = useCallback(async (teamId: string): Promise<void> => {
    await handleUpgradeRole(teamId);
  }, [handleUpgradeRole]);
  
  // Wrapper for role upgrade request
  const handleRequestRoleUpgradeWrapper = useCallback(async (teamId: string): Promise<void> => {
    await handleRequestRoleUpgrade(teamId);
  }, [handleRequestRoleUpgrade]);

  // Wrapper for member invitation
  const handleInviteMemberWrapper = useCallback(async (data: any): Promise<any> => {
    if (data && data.email && data.role && data.teamId) {
      return handleInviteMember(data.email, data.role as UserRole, data.teamId);
    } else if (typeof data === 'string' && selectedTeamId) {
      return handleInviteMember(data, 'viewer' as UserRole, selectedTeamId);
    }
    console.error("Invalid data format for invite member", data);
    return Promise.reject("Invalid invite member data format");
  }, [handleInviteMember, selectedTeamId]);
  
  // Wrapper for role change
  const handleChangeRoleWrapper = useCallback(async (userId: string, role: string): Promise<any> => {
    if (selectedTeamId) {
      return handleChangeRole(userId, role as UserRole);
    }
    return Promise.reject("No team selected");
  }, [handleChangeRole, selectedTeamId]);
  
  // Wrapper for member removal
  const handleRemoveMemberWrapper = useCallback(async (userId: string): Promise<any> => {
    if (selectedTeamId) {
      return handleRemoveMember(userId);
    }
    return Promise.reject("No team selected");
  }, [handleRemoveMember, selectedTeamId]);

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
