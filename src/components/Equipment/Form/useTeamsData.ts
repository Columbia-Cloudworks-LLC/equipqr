
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Team {
  id: string;
  name: string;
  org_name?: string;
  is_external?: boolean;
  role?: string;
}

export function useTeamsData() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get user's auth id
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
          setTeams([]);
          return;
        }
        
        const authUserId = sessionData.session.user.id;
        
        // Get user's organization for determining external teams
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('org_id')
          .eq('id', authUserId)
          .single();
          
        const userOrgId = userProfile?.org_id;
        
        // Get user's teams including external ones
        const { data: userTeams, error: teamsError } = await supabase.functions.invoke('get_user_teams', {
          body: { user_id: authUserId }
        });
        
        if (teamsError) {
          throw new Error(teamsError.message);
        }
        
        if (userTeams?.teams) {
          const processedTeams = userTeams.teams.map(team => ({
            id: team.id,
            name: team.name,
            org_name: team.org_name || 'Your Organization',
            is_external: team.org_id !== userOrgId,
            role: team.role
          }));
          
          setTeams(processedTeams);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeams();
  }, []);

  return { teams, isLoading, error };
}
