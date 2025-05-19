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
  const [error, setError] = useState<string | null>(null);

  const refreshTeams = useCallback(async () => {
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
        .rpc('get_team_members_with_roles', { _user_id: userId });
      
      // Convert and set the teams
      if (membershipData && Array.isArray(membershipData)) {
        const processedTeams = membershipData.filter(team => team && team.id).map(team => ({
          id: team.id,
          name: team.name || 'Unnamed Team',
          role: team.role || 'viewer',
          organizationId: team.org_id,
          organizationName: team.org_name
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

  useEffect(() => {
    refreshTeams();
  }, [refreshTeams]);

  return { teams, isLoading, error, refreshTeams };
}
