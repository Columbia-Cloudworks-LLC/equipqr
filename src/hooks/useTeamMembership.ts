
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
      console.log('No user or organization, clearing team memberships');
      setTeamMemberships([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching team memberships for user:', user.id, 'org:', currentOrganization.id);
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

      console.log('Raw team memberships data:', data);

      // Type the data correctly by casting the role field
      const typedData: TeamMembership[] = (data || []).map(item => ({
        ...item,
        role: item.role as 'manager' | 'technician' | 'requestor' | 'viewer'
      }));

      console.log('Processed team memberships:', typedData);
      setTeamMemberships(typedData);
    } catch (err) {
      console.error('Error fetching team memberships:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch team memberships';
      setError(errorMessage);
      
      // Don't clear existing data on temporary errors
      if (!errorMessage.includes('policy') && !errorMessage.includes('permission')) {
        setTeamMemberships([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasTeamRole = (teamId: string, role: string): boolean => {
    const membership = teamMemberships.find(tm => tm.team_id === teamId);
    const hasRole = membership?.role === role;
    console.log(`Checking team role for ${teamId}, role ${role}:`, hasRole);
    return hasRole;
  };

  const hasTeamAccess = (teamId: string): boolean => {
    const hasAccess = teamMemberships.some(tm => tm.team_id === teamId);
    console.log(`Checking team access for ${teamId}:`, hasAccess);
    return hasAccess;
  };

  const canManageTeam = (teamId: string): boolean => {
    // User can manage team if they are:
    // 1. Organization owner or admin, OR
    // 2. Team manager
    if (!currentOrganization) {
      console.log('No current organization, cannot manage team');
      return false;
    }
    
    const isOrgAdmin = ['owner', 'admin'].includes(currentOrganization.userRole);
    const isTeamManager = hasTeamRole(teamId, 'manager');
    const canManage = isOrgAdmin || isTeamManager;
    
    console.log(`Can manage team ${teamId}:`, {
      isOrgAdmin,
      isTeamManager,
      canManage,
      userRole: currentOrganization.userRole
    });
    
    return canManage;
  };

  const getUserTeamIds = (): string[] => {
    const teamIds = teamMemberships.map(tm => tm.team_id);
    console.log('User team IDs:', teamIds);
    return teamIds;
  };

  useEffect(() => {
    console.log('Team membership effect triggered:', {
      user: user?.id,
      organization: currentOrganization?.id
    });
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
