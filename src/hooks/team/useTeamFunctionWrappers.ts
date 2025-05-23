
import { useCallback } from 'react';
import { UserRole } from '@/types/supabase-enums';

export function useTeamFunctionWrappers(
  selectedTeamId: string,
  selectedOrgId: string, // Added organization ID parameter
  handleInviteMember: (email: string, role: UserRole, teamId: string) => Promise<any>,
  handleChangeRole: (userId: string, role: UserRole) => Promise<any>,
  handleRemoveMember: (userId: string) => Promise<any>,
  handleResendInvite: (id: string) => Promise<any>,
  handleCancelInvitation: (id: string) => Promise<any>,
  handleCreateTeam: (name: string, orgId: string) => Promise<any>,
  handleUpdateTeam: (id: string, name: string) => Promise<any>,
  handleDeleteTeam: (teamId: string) => Promise<any>,
  handleRepairTeam: (teamId: string) => Promise<any>,
  handleUpgradeRole: (teamId: string) => Promise<any>,
  handleRequestRoleUpgrade: (teamId: string) => Promise<any>
) {
  // Wrapper for team creation with org context - FIX: use selectedOrgId instead of selectedTeamId
  const handleCreateTeamWithOrg = useCallback(async (name: string) => {
    console.log(`Creating team with name: ${name}, organization ID: ${selectedOrgId}`);
    return handleCreateTeam(name, selectedOrgId);
  }, [handleCreateTeam, selectedOrgId]);

  // Wrapper for team update
  const handleUpdateTeamWrapper = useCallback(async (id: string, name: string): Promise<any> => {
    return handleUpdateTeam(id, name);
  }, [handleUpdateTeam]);
  
  // Wrapper for team deletion
  const handleDeleteTeamWrapper = useCallback(async (teamId: string): Promise<any> => {
    return handleDeleteTeam(teamId);
  }, [handleDeleteTeam]);
  
  // Wrapper for team repair
  const handleRepairTeamWrapper = useCallback(async (): Promise<any> => {
    return handleRepairTeam(selectedTeamId);
  }, [handleRepairTeam, selectedTeamId]);
  
  // Wrapper for role upgrade
  const handleUpgradeRoleWrapper = useCallback(async (): Promise<any> => {
    return handleUpgradeRole(selectedTeamId);
  }, [handleUpgradeRole, selectedTeamId]);
  
  // Wrapper for role upgrade request
  const handleRequestRoleUpgradeWrapper = useCallback(async (): Promise<any> => {
    return handleRequestRoleUpgrade(selectedTeamId);
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
