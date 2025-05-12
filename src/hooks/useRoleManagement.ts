
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { TeamMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { checkRoleChangePermission, upgradeToManagerRole, requestRoleUpgrade } from '@/services/team';

export function useRoleManagement(members: TeamMember[], teamId: string | null) {
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>(undefined);
  const [canChangeRoles, setCanChangeRoles] = useState(false);
  const [isUpgradingRole, setIsUpgradingRole] = useState(false);
  const [isRequestingRole, setIsRequestingRole] = useState(false);

  // Determine the current user's role in the selected team
  useEffect(() => {
    if (members?.length > 0) {
      (async () => {
        const { data } = await supabase.auth.getSession();
        const authUserId = data.session?.user?.id;
        if (authUserId) {
          // Find the member that corresponds to current user
          const currentMember = members.find(m => m.auth_uid === authUserId);
          if (currentMember) {
            setCurrentUserRole(currentMember.role);
            console.log('Current user role:', currentMember.role);
          }
        }
      })();
    }
  }, [members]);

  // Check if user has permission to manage roles
  useEffect(() => {
    const checkPermission = async () => {
      if (teamId) {
        try {
          // Use the more robust role permission check
          const hasPermission = await checkRoleChangePermission(teamId);
          setCanChangeRoles(hasPermission);
        } catch (error) {
          console.error("Error checking role permission:", error);
          setCanChangeRoles(false);
        }
      }
    };
    
    checkPermission();
  }, [teamId, currentUserRole]);

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
