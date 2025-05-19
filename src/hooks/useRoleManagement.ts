
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types';

export function useRoleManagement(members: TeamMember[], teamId?: string, accessRole?: string | null) {
  const [orgRole, setOrgRole] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [canAssignRoles, setCanAssignRoles] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpgradingRole, setIsUpgradingRole] = useState<boolean>(false);
  const [isRequestingRole, setIsRequestingRole] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [organizationRole, setOrganizationRole] = useState<string | null>(null);
  const [canChangeRoles, setCanChangeRoles] = useState<boolean>(false);

  useEffect(() => {
    if (members && Array.isArray(members)) {
      setTeamMembers(members);
    }
  }, [members]);

  // Initialize roles based on accessRole
  useEffect(() => {
    if (accessRole) {
      setCurrentUserRole(accessRole);
      setCanChangeRoles(['owner', 'manager'].includes(accessRole));
    }
  }, [accessRole]);

  useEffect(() => {
    const loadRoleData = async () => {
      if (!teamId) {
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Get team organization to check permissions
        if (teamId) {
          const { data: teamData, error: teamError } = await supabase
            .from('team')
            .select('org_id')
            .eq('id', teamId)
            .single();
          
          if (teamError) {
            console.error('Error fetching team:', teamError);
            setError('Failed to load team data');
            return;
          }
          
          const teamOrgId = teamData?.org_id;
          
          // Get user's current role in organization
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData?.session?.user?.id;
          
          if (userId && teamOrgId) {
            const { data: orgRoleData, error: orgRoleError } = await supabase
              .rpc('get_org_role', { 
                p_auth_user_id: userId, 
                p_org_id: teamOrgId 
              });
            
            if (orgRoleError) {
              console.error('Error fetching user org role:', orgRoleError);
            } else {
              const roleStr = String(orgRoleData || '');
              setOrgRole(roleStr);
              setOrganizationRole(roleStr);
              setCanAssignRoles(['owner', 'manager'].includes(roleStr));
              setCanChangeRoles(['owner', 'manager'].includes(roleStr));
            }
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
  }, [teamId]);

  const handleUpgradeRole = async (teamId: string) => {
    // Implementation for upgrading role
    setIsUpgradingRole(true);
    try {
      // Add implementation here
      console.log(`Upgrading role for team ${teamId}`);
      return { success: true };
    } catch (error) {
      console.error("Error upgrading role:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    } finally {
      setIsUpgradingRole(false);
    }
  };

  const handleRequestRoleUpgrade = async (teamId: string) => {
    // Implementation for requesting role upgrade
    setIsRequestingRole(true);
    try {
      // Add implementation here
      console.log(`Requesting role upgrade for team ${teamId}`);
      return { success: true };
    } catch (error) {
      console.error("Error requesting role upgrade:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    } finally {
      setIsRequestingRole(false);
    }
  };

  return {
    orgRole,
    teamMembers,
    canAssignRoles,
    isLoading,
    error,
    currentUserRole,
    organizationRole,
    canChangeRoles,
    isUpgradingRole,
    isRequestingRole,
    handleRequestRoleUpgrade,
    handleUpgradeRole
  };
}
