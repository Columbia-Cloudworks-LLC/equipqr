
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

  // Initialize roles based on accessRole with enhanced logic
  useEffect(() => {
    if (accessRole) {
      setCurrentUserRole(accessRole);
      // Enhanced role checking for organization owners
      const isManagerOrAbove = ['owner', 'manager', 'admin'].includes(accessRole);
      setCanChangeRoles(isManagerOrAbove);
      setCanAssignRoles(isManagerOrAbove);
    }
  }, [accessRole]);

  useEffect(() => {
    const loadRoleData = async () => {
      if (!teamId) {
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Get current user session
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        
        if (!userId) {
          setError('User not authenticated');
          return;
        }

        // Get team organization to check permissions
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
        
        if (teamOrgId) {
          // Get user's role in the team's organization
          const { data: orgRoleData, error: orgRoleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('org_id', teamOrgId)
            .single();
          
          if (orgRoleError) {
            console.error('Error fetching user org role:', orgRoleError);
          } else if (orgRoleData) {
            const roleStr = orgRoleData.role;
            setOrgRole(roleStr);
            setOrganizationRole(roleStr);
            
            // Enhanced permission logic for organization owners
            const hasOrgPermission = ['owner', 'manager', 'admin'].includes(roleStr);
            setCanAssignRoles(hasOrgPermission);
            setCanChangeRoles(hasOrgPermission);
            
            // If user has org-level permission but no team role, use org role
            if (hasOrgPermission && !accessRole) {
              setCurrentUserRole(roleStr);
            }
            
            console.log(`Role management: userId=${userId}, teamOrgId=${teamOrgId}, orgRole=${roleStr}, hasOrgPermission=${hasOrgPermission}`);
          }
          
          // Get user's organization ID to check if they're in the same org
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('org_id')
            .eq('id', userId)
            .single();
          
          // Enhanced same-org logic
          if (userProfile && userProfile.org_id === teamOrgId) {
            console.log('User is in same organization as team, checking permissions');
            
            // Use organization role for permissions when user is in same org
            if (orgRoleData && ['owner', 'manager', 'admin'].includes(orgRoleData.role)) {
              setCanAssignRoles(true);
              setCanChangeRoles(true);
              console.log(`Organization role ${orgRoleData.role} grants team management permissions`);
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
  }, [teamId, accessRole]);

  const handleUpgradeRole = async (teamId: string) => {
    setIsUpgradingRole(true);
    try {
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
    setIsRequestingRole(true);
    try {
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
