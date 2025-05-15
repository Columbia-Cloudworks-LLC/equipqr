
import { useState, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { checkEquipmentEditPermission } from '@/services/equipment/permissions/accessCheck';

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
        // If we have an equipment ID, use the permission checker service
        if (equipmentId) {
          const hasPermission = await checkEquipmentEditPermission(user.id, equipmentId);
          setCanEdit(hasPermission);
          return;
        }
        
        // Fallback to checking user roles directly (for new equipment)
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error) {
          console.error('Error checking user roles:', error);
          setPermissionCheckError("Couldn't verify edit permissions");
          setCanEdit(false);
          return;
        }
          
        if (data && ['owner', 'manager'].includes(data.role)) {
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
