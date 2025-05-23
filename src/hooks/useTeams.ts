import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createTeam } from '@/services/team/creation/createTeam';

interface Team {
  id: string;
  name: string;
  role: string;
  org_id: string;
  organizationId: string;
  organizationName: string;
  deleted_at?: string | null;
}

interface TeamWithRole extends Team {
  org_role?: string;
}

export function useTeams() {
  const [teams, setTeams] = useState<TeamWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('No active session');
      }

      const userId = sessionData.session.user.id;
      
      // First try using the Edge Function for teams with roles
      try {
        const { data, error } = await supabase.functions.invoke('get_user_teams', {
          body: { 
            user_id: userId,
            include_all_orgs: true  // Get teams from all organizations, not just primary
          }
        });
        
        if (error) throw error;
        
        if (data && Array.isArray(data.teams)) {
          const typedTeams = data.teams.map((team: any) => ({
            id: team.id,
            name: team.name,
            role: team.role || 'viewer',
            org_id: team.org_id,
            organizationId: team.org_id,
            organizationName: team.org_name,
            deleted_at: team.deleted_at,  // Include deleted_at field
            org_role: team.org_role       // Include organization role
          }));
          
          setTeams(typedTeams);
          return;
        }
      } catch (edgeError) {
        console.error('Edge function failed, falling back to direct query', edgeError);
      }
      
      // Fallback: Direct query for teams through team membership
      const { data: membershipData } = await supabase
        .rpc('get_team_members_with_roles', { _team_id: null });
      
      // Also fetch all teams to get deleted_at status
      const { data: allTeamsData } = await supabase
        .from('team')
        .select('id, deleted_at');
        
      // Create a map of team ID to deleted_at status
      const deletedStatusMap = new Map();
      if (allTeamsData) {
        allTeamsData.forEach((team: any) => {
          deletedStatusMap.set(team.id, team.deleted_at);
        });
      }
      
      // Fetch org roles for the user
      const { data: orgRolesData } = await supabase
        .from('user_roles')
        .select('role, org_id');
        
      // Create a map of org ID to role
      const orgRolesMap = new Map();
      if (orgRolesData) {
        orgRolesData.forEach((role: any) => {
          orgRolesMap.set(role.org_id, role.role);
        });
      }
      
      // Convert and set the teams
      if (membershipData && Array.isArray(membershipData)) {
        const processedTeams = membershipData
          .filter(team => team && team.id)
          .map(team => {
            // Using type assertion since we know the structure coming from the DB
            const teamData = team as any;
            return {
              id: teamData.id,
              name: teamData.name || 'Unnamed Team',
              role: teamData.role || 'viewer',
              org_id: teamData.org_id || '',
              organizationId: teamData.org_id || '',
              organizationName: teamData.org_name || '',
              deleted_at: deletedStatusMap.get(teamData.id) || null,
              org_role: orgRolesMap.get(teamData.org_id) || null
            };
          });
        
        setTeams(processedTeams);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError(error instanceof Error ? error.message : 'Failed to load teams');
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Added retry function
  const retryFetchTeams = useCallback(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Updated to use the proper service layer createTeam function
  const handleCreateTeam = useCallback(async (name: string, orgId?: string) => {
    try {
      setIsCreatingTeam(true);
      setError(null);
      
      console.log(`useTeams: Creating team "${name}" with orgId: ${orgId}`);
      
      // Use the service layer function that properly handles auth/app_user ID conversion
      const result = await createTeam(name, orgId || '');
      
      console.log('useTeams: Team creation result:', result);
      
      // Refresh the teams list after successful creation
      await fetchTeams();
      
      return { success: true, team: result };
    } catch (error) {
      console.error('useTeams: Failed to create team:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsCreatingTeam(false);
    }
  }, [fetchTeams]);

  const handleUpdateTeam = useCallback(async (id: string, name: string) => {
    try {
      setIsUpdatingTeam(true);
      setError(null);
      
      const { error: updateError } = await supabase
        .from('team')
        .update({ name })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await fetchTeams();
      return { success: true };
    } catch (error) {
      console.error('Failed to update team:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdatingTeam(false);
    }
  }, [fetchTeams]);

  const handleDeleteTeam = useCallback(async (id: string) => {
    try {
      setIsDeletingTeam(true);
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('team')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      await fetchTeams();
      return { success: true };
    } catch (error) {
      console.error('Failed to delete team:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsDeletingTeam(false);
    }
  }, [fetchTeams]);

  // Function to get equipment count for a team
  const getTeamEquipmentCount = useCallback(async (teamId: string) => {
    try {
      const { count, error } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .is('deleted_at', null);
        
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Error counting team equipment:', error);
      return 0;
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return { 
    teams, 
    isLoading, 
    error, 
    refreshTeams: fetchTeams,
    isCreatingTeam,
    isUpdatingTeam,
    isDeletingTeam,
    fetchTeams,
    retryFetchTeams,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    getTeamEquipmentCount
  };
}
