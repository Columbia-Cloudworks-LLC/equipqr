
import { useState, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { checkCreatePermission } from '@/services/equipment/permissions/createPermissionCheck';
import { UserOrganization } from '@/services/organization/userOrganizations';
import { validateUserAccess } from '@/services/equipment/utils/schemaValidator';

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
        // First validate user access
        const userValidation = await validateUserAccess();
        if (!userValidation.isValid) {
          console.error('User validation failed:', userValidation.error);
          setPermittedOrganizations([]);
          return;
        }
        
        // For each organization, check if user can create equipment
        const permissionChecks = await Promise.all(
          organizations.map(async (org) => {
            try {
              // Check basic create permission without team
              const result = await checkCreatePermission(null);
              
              // Also check if the user has appropriate roles in this org
              const canCreate = ['owner', 'manager'].includes(org.role || '') || 
                              result.hasPermission;
              
              return {
                org,
                canCreate,
                reason: result.reason
              };
            } catch (error) {
              console.error(`Permission check failed for org ${org.id}:`, error);
              return {
                org,
                canCreate: ['owner', 'manager'].includes(org.role || ''),
                reason: 'fallback_role_check'
              };
            }
          })
        );

        // Filter to only organizations where user can create equipment
        const permitted = permissionChecks
          .filter(check => check.canCreate)
          .map(check => check.org);

        console.log('Permitted organizations for equipment creation:', permitted.length);
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
