
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { TeamMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { checkRoleChangePermission, upgradeToManagerRole, requestRoleUpgrade } from '@/services/team/roleService';

export function useRoleManagement(members: TeamMember[], teamId: string | null) {
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>(undefined);
  const [canChangeRoles, setCanChangeRoles] = useState(false);
  const [isUpgradingRole, setIsUpgradingRole] = useState(false);
  const [isRequestingRole, setIsRequestingRole] = useState(false);

  // Determine the current user's role in the selected team
  useEffect(() => {
    if (members?.length > 0 && teamId) {
      (async () => {
        const { data } = await supabase.auth.getSession();
        const authUserId = data.session?.user?.id;
        if (authUserId) {
          // Find the member that corresponds to current user
          const currentMember = members.find(m => m.auth_uid === authUserId);
          if (currentMember) {
            console.log('Current user role detected:', currentMember.role);
            setCurrentUserRole(currentMember.role);
            
            // Check if the role allows management (manager, owner, admin)
            const managerRoles = ['manager', 'owner', 'admin', 'creator'];
            setCanChangeRoles(managerRoles.includes(currentMember.role));
          } else {
            console.log('User not found in team members list');
            setCurrentUserRole(undefined);
            setCanChangeRoles(false);
          }
        }
      })();
    } else {
      // Reset role when team changes or members list is empty
      setCurrentUserRole(undefined);
    }
  }, [members, teamId]);

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
    canChangeRoles,
    isUpgradingRole,
    isRequestingRole,
    handleRequestRoleUpgrade,
    handleUpgradeRole
  };
}
