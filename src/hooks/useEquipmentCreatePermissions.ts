
import { useState, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { checkCreatePermission } from '@/services/equipment/permissions/createPermissionCheck';
import { UserOrganization } from '@/services/organization/userOrganizations';

interface UseEquipmentCreatePermissionsProps {
  organizations: UserOrganization[];
}

export function useEquipmentCreatePermissions({ organizations }: UseEquipmentCreatePermissionsProps) {
  const { user } = useAuthState();
  const [permittedOrganizations, setPermittedOrganizations] = useState<UserOrganization[]>([]);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || organizations.length === 0) {
        setPermittedOrganizations([]);
        return;
      }

      setIsCheckingPermissions(true);
      
      try {
        // Check permissions for each organization
        const permissionChecks = await Promise.all(
          organizations.map(async (org) => {
            // For equipment creation without a specific team, we pass null as teamId
            const result = await checkCreatePermission(null);
            
            // Check if the user can create equipment in this specific organization
            // This is determined by checking if they have appropriate roles
            const canCreate = ['owner', 'manager'].includes(org.role || '') || 
                            result.hasPermission;
            
            return {
              org,
              canCreate
            };
          })
        );

        // Filter to only organizations where user can create equipment
        const permitted = permissionChecks
          .filter(check => check.canCreate)
          .map(check => check.org);

        setPermittedOrganizations(permitted);
      } catch (error) {
        console.error('Error checking equipment creation permissions:', error);
        // Fallback: filter by role only
        const fallbackPermitted = organizations.filter(org => 
          ['owner', 'manager'].includes(org.role || '')
        );
        setPermittedOrganizations(fallbackPermitted);
      } finally {
        setIsCheckingPermissions(false);
      }
    };

    checkPermissions();
  }, [user, organizations]);

  return {
    permittedOrganizations,
    isCheckingPermissions
  };
}
