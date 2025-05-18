
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { TeamMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { 
  checkRoleChangePermission, 
  upgradeToManagerRole, 
  requestRoleUpgrade,
  getEffectiveRole
} from '@/services/team/roleService';

export function useRoleManagement(members: TeamMember[], teamId: string | null, accessRole?: string | null) {
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>(undefined);
  const [canChangeRoles, setCanChangeRoles] = useState(false);
  const [isUpgradingRole, setIsUpgradingRole] = useState(false);
  const [isRequestingRole, setIsRequestingRole] = useState(false);
  const [organizationRole, setOrganizationRole] = useState<string | null>(null);

  // Determine the current user's role in the selected team
  useEffect(() => {
    if (teamId) {
      (async () => {
        const { data } = await supabase.auth.getSession();
        const authUserId = data.session?.user?.id;
        if (authUserId) {
          let determinedRole: string | null | undefined = undefined;
          
          // First check if we have a role from members list
          if (members?.length > 0) {
            // Find the member that corresponds to current user
            const currentMember = members.find(m => m.auth_uid === authUserId);
            if (currentMember) {
              determinedRole = currentMember.role;
              console.log('Current user role from members list:', currentMember.role);
            }
          }
          
          // If we have an accessRole from team membership check
          if (!determinedRole && accessRole) {
            determinedRole = accessRole;
            console.log('Current user role from accessRole:', accessRole);
          }
          
          // Get organization role
          try {
            if (teamId && teamId !== 'none') {
              const { data: teamData } = await supabase
                .from('team')
                .select('org_id')
                .eq('id', teamId)
                .single();
                
              if (teamData?.org_id) {
                const { data: orgRole } = await supabase.rpc('get_org_role', {
                  p_auth_user_id: authUserId,
                  p_org_id: teamData.org_id
                });
                
                setOrganizationRole(orgRole);
                
                // Get effective role (combining team and org roles)
                const effectiveRole = getEffectiveRole(determinedRole, orgRole);
                determinedRole = effectiveRole;
              }
            }
          } catch (error) {
            console.error('Error getting organization role:', error);
          }
          
          if (determinedRole) {
            console.log('Final determined role:', determinedRole);
            setCurrentUserRole(determinedRole);
            
            // Check if the role allows management (manager, owner, admin)
            const managerRoles = ['manager', 'owner', 'admin', 'creator'];
            setCanChangeRoles(managerRoles.includes(determinedRole));
          } else {
            console.log('No role could be determined for user');
            setCurrentUserRole(undefined);
            setCanChangeRoles(false);
          }
        }
      })();
    } else {
      // Reset role when team changes
      setCurrentUserRole(undefined);
      setCanChangeRoles(false);
    }
  }, [members, teamId, accessRole]);

  // Handle role upgrade request
  const handleRequestRoleUpgrade = async (teamId: string) => {
    try {
      setIsRequestingRole(true);
      const result = await requestRoleUpgrade(teamId);
      toast.success("Role upgrade requested", {
        description: result.message,
      });
    } catch (error: any) {
      toast.error("Error requesting role upgrade", {
        description: error.message,
      });
    } finally {
      setIsRequestingRole(false);
    }
  };

  // Handle direct role upgrade (for users with permission)
  const handleUpgradeRole = async (teamId: string) => {
    try {
      setIsUpgradingRole(true);
      await upgradeToManagerRole(teamId);
      toast.success("Role upgraded successfully", {
        description: "You are now a team manager",
      });
      setCurrentUserRole('manager');
      setCanChangeRoles(true);
    } catch (error: any) {
      toast.error("Error upgrading role", {
        description: error.message,
      });
    } finally {
      setIsUpgradingRole(false);
    }
  };

  return {
    currentUserRole,
    organizationRole,
    canChangeRoles,
    isUpgradingRole,
    isRequestingRole,
    handleRequestRoleUpgrade,
    handleUpgradeRole
  };
}
