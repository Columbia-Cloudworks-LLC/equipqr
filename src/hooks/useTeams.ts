
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Team {
  id: string;
  name: string;
  role: string;
  organizationId: string;
  organizationName: string;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
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
          body: { user_id: userId }
        });
        
        if (error) throw error;
        
        if (data && Array.isArray(data.teams)) {
          const typedTeams = data.teams.map((team: any) => ({
            id: team.id,
            name: team.name,
            role: team.role || 'viewer',
            organizationId: team.org_id,
            organizationName: team.org_name
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
      
      // Convert and set the teams
      if (membershipData && Array.isArray(membershipData)) {
        const processedTeams = membershipData
          .filter(team => team && team.id)
          .map(team => ({
            id: team.id,
            name: team.name || 'Unnamed Team',
            role: team.role || 'viewer',
            organizationId: team.org_id || '', // Provide default values
            organizationName: team.org_name || ''
          }));
        
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

  // Implement team CRUD operations
  const handleCreateTeam = useCallback(async (name: string) => {
    try {
      setIsCreatingTeam(true);
      setError(null);
      
      // Implementation of team creation logic
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        throw new Error('Authentication required');
      }
      
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId)
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
        .select();

      if (createError) {
        throw createError;
      }

      await fetchTeams();
      return { success: true, team: teamData?.[0] };
    } catch (error) {
      console.error('Failed to create team:', error);
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
