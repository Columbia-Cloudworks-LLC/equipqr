
import { useState, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to handle attribute editing permissions
 */
export function useAttributePermissions(equipmentId?: string, readOnly: boolean = false, orgId?: string) {
  const { user } = useAuthState();
  const [canEdit, setCanEdit] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [permissionCheckError, setPermissionCheckError] = useState<string | null>(null);

  // Check if user has permission to edit attributes based on role
  useEffect(() => {
    const checkPermission = async () => {
      if (!user || readOnly) {
        setCanEdit(false);
        return;
      }

      setIsCheckingPermission(true);
      setPermissionCheckError(null);
      
      try {
        // If we have an equipment ID, check permissions using the dedicated function
        if (equipmentId) {
          const { data, error } = await supabase.rpc(
            'check_equipment_permissions',
            { 
              _user_id: user.id, 
              _equipment_id: equipmentId,
              _action: 'edit'
            }
          );
          
          if (error) {
            throw new Error(`Permission check failed: ${error.message}`);
          }
          
          console.log(`Permission check for user ${user.id} to edit equipment ${equipmentId}: ${data}`);
          setCanEdit(!!data);
          return;
        }
        
        // For new equipment, check if user can create equipment in the specified organization
        if (orgId) {
          console.log(`Checking create permissions for org ${orgId}`);
          
          // Check user's role in the specific organization
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('org_id', orgId)
            .single();
            
          if (roleError) {
            // If no specific role found, user might not have access to this org
            console.log('No role found for user in specified org:', roleError);
            setCanEdit(false);
            return;
          }
          
          if (roleData && ['owner', 'manager'].includes(roleData.role)) {
            setCanEdit(true);
            return;
          }
          
          setCanEdit(false);
          return;
        }
        
        // Fallback: check if user has any admin-level role in any organization
        const { data: adminRoles, error: adminError } = await supabase
          .from('user_roles')
          .select('role, org_id')
          .eq('user_id', user.id)
          .in('role', ['owner', 'manager']);
          
        if (adminError) {
          console.error('Error checking admin roles:', adminError);
          setPermissionCheckError("Couldn't verify edit permissions");
          setCanEdit(false);
          return;
        }
          
        // If user has any admin role, allow editing (for new equipment without org context)
        setCanEdit(adminRoles && adminRoles.length > 0);
        
      } catch (error) {
        console.error('Error checking permissions:', error);
        const errorMessage = error instanceof Error ? error.message : "Error checking edit permissions";
        setPermissionCheckError(errorMessage);
        setCanEdit(false);
      } finally {
        setIsCheckingPermission(false);
      }
    };
    
    checkPermission();
  }, [user, equipmentId, readOnly, orgId]);

  return { 
    canEdit, 
    isCheckingPermission, 
    permissionCheckError 
  };
}
