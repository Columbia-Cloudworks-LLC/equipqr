
import { useState, useEffect } from 'react';
import { useWorkNotes } from '../useWorkNotes';
import { getUserRoleForWorkOrder } from '@/services/workOrders/workOrderRoleService';
import { canViewWorkOrders, canSubmitWorkOrders, canManageWorkOrders } from '@/services/workOrders/workOrderPermissions';

export function useRoleAwareWorkNotes(equipmentId: string) {
  const [userRole, setUserRole] = useState<'manager' | 'technician' | 'requestor' | 'viewer' | 'none'>('none');
  const [permissions, setPermissions] = useState({
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canViewPrivate: false
  });
  
  const workNotesHook = useWorkNotes(equipmentId);

  // Get user role and permissions
  useEffect(() => {
    const loadUserPermissions = async () => {
      try {
        console.log('Loading user permissions for equipment:', equipmentId);
        
        // Get the user's role for this equipment
        const role = await getUserRoleForWorkOrder(equipmentId);
        console.log('User role for work orders:', role);
        setUserRole(role);

        // Check specific permissions
        const [canView, canSubmit, canManage] = await Promise.all([
          canViewWorkOrders(equipmentId),
          canSubmitWorkOrders(equipmentId),
          canManageWorkOrders(equipmentId)
        ]);

        console.log('Permission check results:', {
          canView,
          canSubmit,
          canManage,
          role
        });

        // Set permissions based on role and checks
        const newPermissions = {
          canCreate: canSubmit,
          canEdit: canManage || role === 'technician', // Technicians can edit their own notes
          canDelete: canManage,
          canViewPrivate: role === 'technician' || canManage // Technicians and managers can see private notes
        };

        console.log('Setting permissions:', newPermissions);
        setPermissions(newPermissions);
      } catch (error) {
        console.error('Error loading user permissions:', error);
        // Default to minimal permissions on error
        setPermissions({
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canViewPrivate: false
        });
      }
    };

    if (equipmentId) {
      loadUserPermissions();
    }
  }, [equipmentId]);

  return {
    ...workNotesHook,
    userRole,
    permissions
  };
}
