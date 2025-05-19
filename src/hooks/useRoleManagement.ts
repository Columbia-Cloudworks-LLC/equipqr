import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRoleManagement(userId?: string, teamId?: string) {
  const [orgRole, setOrgRole] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [canAssignRoles, setCanAssignRoles] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoleData = async () => {
      if (!userId) {
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Get team organization to check permissions
        if (teamId) {
          const { data: teamData, error: teamError } = await supabase
            .from('team')
            .select('org_id')
            .eq('id', teamId as any)
            .single();
          
          if (teamError) {
            console.error('Error fetching team:', teamError);
            setError('Failed to load team data');
            return;
          }
          
          const teamOrgId = teamData?.org_id;
          
          // Get user's current role in organization
          const { data: orgRoleData, error: orgRoleError } = await supabase
            .rpc('get_org_role', { 
              p_auth_user_id: userId as any, 
              p_org_id: teamOrgId as any 
            });
          
          if (orgRoleError) {
            console.error('Error fetching user org role:', orgRoleError);
          } else {
            setOrgRole(String(orgRoleData || ''));
            setCanAssignRoles(['owner', 'manager'].includes(String(orgRoleData)));
          }
          
          // Get team members
          const { data: membersData, error: membersError } = await supabase
            .rpc('get_team_members_with_roles', { _team_id: teamId as any });
          
          if (membersError) {
            setError('Failed to load team members');
            console.error('Error fetching team members:', membersError);
          } else {
            setTeamMembers(membersData || []);
          }
        }
      } catch (err) {
        console.error('Error loading role data:', err);
        setError('Failed to load role data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRoleData();
  }, [userId, teamId]);

  return {
    orgRole,
    teamMembers,
    canAssignRoles,
    isLoading,
    error
  };
}
