
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Team {
  id: string;
  name: string;
  org_id: string;
  org_name?: string;
  is_external?: boolean;
  role?: string;
}

export function useTeamsData() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | Error | null>(null);

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
        
        // Get user's primary organization for determining external teams
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('org_id')
          .eq('id', authUserId)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setError(profileError.message);
          setTeams([]);
          return;
        }
        
        const userOrgId = userProfile?.org_id;
        
        // Get user's teams including external ones across all organizations
        const { data: userTeams, error: teamsError } = await supabase.functions.invoke('get_user_teams', {
          body: { user_id: authUserId, include_all_orgs: true }
        });
        
        if (teamsError) {
          throw new Error(teamsError.message);
        }
        
        if (userTeams?.teams) {
          const processedTeams = userTeams.teams.map((team: any) => ({
            id: team.id,
            name: team.name,
            org_id: team.org_id,
            org_name: team.org_name || 'Your Organization',
            is_external: team.org_id !== userOrgId,
            role: team.role
          }));
          
          // Sort teams: primary org first, then alphabetically
          processedTeams.sort((a: Team, b: Team) => {
            // Primary organization teams first
            if (a.org_id === userOrgId && b.org_id !== userOrgId) return -1;
            if (a.org_id !== userOrgId && b.org_id === userOrgId) return 1;
            
            // Same organization, sort by name
            if (a.org_id === b.org_id) return a.name.localeCompare(b.name);
            
            // Different organizations, sort by organization name then team name
            return a.org_name!.localeCompare(b.org_name!) || a.name.localeCompare(b.name);
          });
          
          setTeams(processedTeams);
        }
      } catch (err) {
        console.error("Error fetching teams:", err);
        if (err instanceof Error) {
          setError(err);
        } else if (typeof err === 'string') {
          setError(err);
        } else {
          setError('Unknown error fetching teams');
        }
        setTeams([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeams();
  }, []);

  return { teams, isLoading, error };
}
