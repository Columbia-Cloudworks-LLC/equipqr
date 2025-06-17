
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface TeamMembership {
  team_id: string;
  team_name: string;
  role: 'manager' | 'technician' | 'requestor' | 'viewer';
  joined_date: string;
}

export interface TeamMembershipContextType {
  teamMemberships: TeamMembership[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasTeamRole: (teamId: string, role: string) => boolean;
  hasTeamAccess: (teamId: string) => boolean;
  canManageTeam: (teamId: string) => boolean;
  getUserTeamIds: () => string[];
}

export const useTeamMembership = (): TeamMembershipContextType => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [teamMemberships, setTeamMemberships] = useState<TeamMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMemberships = async () => {
    if (!user || !currentOrganization) {
      setTeamMemberships([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Use the security definer function to get team memberships
      const { data, error: fetchError } = await supabase
        .rpc('get_user_team_memberships', {
          user_uuid: user.id,
          org_id: currentOrganization.id
        });

      if (fetchError) {
        console.error('Error fetching team memberships:', fetchError);
        throw fetchError;
      }

      // Type the data correctly by casting the role field
      const typedData: TeamMembership[] = (data || []).map(item => ({
        ...item,
        role: item.role as 'manager' | 'technician' | 'requestor' | 'viewer'
      }));

      setTeamMemberships(typedData);
    } catch (err) {
      console.error('Error fetching team memberships:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch team memberships');
    } finally {
      setIsLoading(false);
    }
  };

  const hasTeamRole = (teamId: string, role: string): boolean => {
    const membership = teamMemberships.find(tm => tm.team_id === teamId);
    return membership?.role === role;
  };

  const hasTeamAccess = (teamId: string): boolean => {
    return teamMemberships.some(tm => tm.team_id === teamId);
  };

  const canManageTeam = (teamId: string): boolean => {
    // User can manage team if they are:
    // 1. Organization owner or admin, OR
    // 2. Team manager
    if (!currentOrganization) return false;
    
    const isOrgAdmin = ['owner', 'admin'].includes(currentOrganization.userRole);
    const isTeamManager = hasTeamRole(teamId, 'manager');
    
    return isOrgAdmin || isTeamManager;
  };

  const getUserTeamIds = (): string[] => {
    return teamMemberships.map(tm => tm.team_id);
  };

  useEffect(() => {
    fetchTeamMemberships();
  }, [user, currentOrganization]);

  return {
    teamMemberships,
    isLoading,
    error,
    refetch: fetchTeamMemberships,
    hasTeamRole,
    hasTeamAccess,
    canManageTeam,
    getUserTeamIds
  };
};
