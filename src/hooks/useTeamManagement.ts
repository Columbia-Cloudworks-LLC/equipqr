import { useState, useEffect, useCallback } from 'react';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { useTeams } from './useTeams';
import { useTeamMembers } from './useTeamMembers';
import { useTeamMembership } from './useTeamMembership';
import { useRoleManagement } from './useRoleManagement';

export function useTeamManagement() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  
  // Use the smaller, focused hooks
  const { 
    teams,
    isLoading: isTeamsLoading,
    isCreatingTeam,
    isUpdatingTeam,
    isDeletingTeam,
    error: teamsError,
    fetchTeams,
    retryFetchTeams,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    getTeamEquipmentCount
  } = useTeams();
  
  const {
    members,
    pendingInvitations,
    isLoading: isMembersLoading,
    isLoadingInvitations,
    error: membersError,
    fetchTeamMembers,
    fetchPendingInvitations,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation
  } = useTeamMembers(selectedTeamId);
  
  const {
    isMember,
    isRepairingTeam,
    currentUserId,
    accessRole,
    error: membershipError,
    handleRepairTeam,
    retryAccessCheck
  } = useTeamMembership(selectedTeamId);
  
  const {
    currentUserRole,
    organizationRole,
    canChangeRoles,
    isUpgradingRole,
    isRequestingRole,
    handleRequestRoleUpgrade,
    handleUpgradeRole
  } = useRoleManagement(members, selectedTeamId, accessRole);

  // Refresh teams when component mounts
  useEffect(() => {
    console.log('useTeamManagement: Initial teams fetch');
    fetchTeams();
  }, []);

  // Select first team if available and none is selected
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      console.log('Setting selected team to:', teams[0].id);
      setSelectedTeamId(teams[0].id);
    } else if (teams.length > 0 && selectedTeamId && !teams.find(team => team.id === selectedTeamId)) {
      // If currently selected team no longer exists (e.g., after deletion),
      // select the first available team instead
      console.log('Previously selected team not found, selecting first available team');
      setSelectedTeamId(teams[0].id);
    } else if (teams.length === 0) {
      // Clear selection if there are no teams
      setSelectedTeamId('');
    }
  }, [teams, selectedTeamId]);

  // Fetch team members when selectedTeamId changes
  useEffect(() => {
    if (selectedTeamId && selectedTeamId !== 'none') {
      console.log(`Selected team changed to: ${selectedTeamId}, isMember: ${isMember}`);
      
      // Even if not a member yet, try to fetch data
      // This handles race conditions where isMember hasn't updated yet
      fetchTeamMembers();
      fetchPendingInvitations();
    }
  }, [selectedTeamId]);

  // Retry logic for empty teams list
  useEffect(() => {
    if (teams.length === 0 && !isTeamsLoading) {
      // Wait a bit and retry once
      const timer = setTimeout(() => {
        console.log('No teams found, retrying fetch...');
        retryFetchTeams();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [teams.length, isTeamsLoading]);

  // Combine errors from all sources
  const error = teamsError || membersError || membershipError;
  
  // Combined loading state
  const isLoading = isTeamsLoading || isMembersLoading;

  // Memoize functions to prevent unnecessary re-renders
  const refetchTeamMembers = useCallback(() => {
    if (selectedTeamId && selectedTeamId !== 'none') {
      fetchTeamMembers();
    }
  }, [selectedTeamId, fetchTeamMembers]);
  
  const refetchPendingInvitations = useCallback(() => {
    if (selectedTeamId && selectedTeamId !== 'none') {
      fetchPendingInvitations();
    }
  }, [selectedTeamId, fetchPendingInvitations]);

  const createTeam = async (name: string) => {
    if (!name || name.trim() === '') {
      setError('Team name is required');
      return { success: false, error: 'Team name is required' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      if (!userId) {
        throw new Error('Authentication required');
      }

      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId as any)
        .single();

      if (userError || !userData) {
        throw new Error('Failed to get user organization');
      }

      const { data: teamData, error: createError } = await supabase
        .from('team')
        .insert({
          name, 
          org_id: userData.org_id,
          created_by: userId
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      if (!teamData) {
        throw new Error('Failed to create team');
      }

      // Fix the app_user query 
      const { data: appUserData, error: appUserError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId as any)
        .single();

      if (appUserError || !appUserData) {
        throw new Error('Failed to get user data');
      }

      const appUserId = appUserData.id;

      // Add creator as a team member with manager role
      const { data: memberData, error: memberError } = await supabase
        .from('team_member')
        .insert({
          team_id: teamData.id,
          user_id: appUserId
        })
        .select()
        .single();

      if (memberError || !memberData) {
        throw new Error('Failed to add member to team');
      }

      const { error: roleError } = await supabase
        .from('team_roles')
        .insert({
          team_member_id: memberData.id,
          role: 'manager',
          assigned_by: userId
        });

      if (roleError) {
        throw new Error('Failed to assign team role');
      }

      setTeams(prevTeams => prevTeams ? [...prevTeams, teamData as any] : [teamData as any]);
      
      return { success: true, team: teamData };

    } catch (error) {
      console.error('Failed to create team:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAndSelectTeam = useCallback(async (name: string) => {
    const team = await createTeam(name);
    if (team?.id) {
      setSelectedTeamId(team.id);
    }
    return team;
  }, [createTeam]);
  
  // Enhanced delete team handler that updates selection if needed
  const handleDeleteAndUpdateSelection = useCallback(async (teamId: string) => {
    try {
      // Try to delete the team
      await handleDeleteTeam(teamId);
      
      // If we just deleted the currently selected team, this will be handled
      // in the useEffect that monitors teams and selectedTeamId
    } catch (error) {
      // Let the error propagate up for UI handling
      throw error;
    }
  }, [handleDeleteTeam]);
  
  // Log for debugging
  useEffect(() => {
    console.log('useTeamManagement state:', {
      teams: teams.length,
      selectedTeamId,
      isLoading,
      isMember,
      members: members.length,
      currentUserRole,
      accessRole,
      organizationRole
    });
  }, [teams.length, selectedTeamId, isLoading, isMember, members.length, currentUserRole, accessRole, organizationRole]);

  return {
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
    isUpgradingRole,
    isRequestingRole,
    isMember,
    currentUserRole,
    canChangeRoles,
    error,
    setSelectedTeamId,
    handleCreateTeam: handleCreateAndSelectTeam,
    handleUpdateTeam,
    handleDeleteTeam: handleDeleteAndUpdateSelection,
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
  };
}
