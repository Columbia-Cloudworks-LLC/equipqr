
import { useState, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to handle attribute editing permissions
 */
export function useAttributePermissions(equipmentId?: string, readOnly: boolean = false) {
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
        // If we have an equipment ID, check permissions
        if (equipmentId) {
          // Use the correct parameter names for the Supabase function
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
          setCanEdit(!!data); // Convert to boolean
          return;
        }
        
        // Fallback to checking user roles directly (for new equipment)
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id as any) // Type casting for compatibility
          .maybeSingle();
          
        if (error) {
          console.error('Error checking user roles:', error);
          setPermissionCheckError("Couldn't verify edit permissions");
          setCanEdit(false);
          return;
        }
          
        if (data && data.role && ['owner', 'manager'].includes(data.role)) {
          setCanEdit(true);
        } else {
          // Default to true for new equipment creation
          setCanEdit(true);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        setPermissionCheckError("Error checking edit permissions");
        setCanEdit(false);
      } finally {
        setIsCheckingPermission(false);
      }
    };
    
    checkPermission();
  }, [user, equipmentId, readOnly]);

  return { 
    canEdit, 
    isCheckingPermission, 
    permissionCheckError 
  };
}
