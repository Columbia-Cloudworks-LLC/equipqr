
import { useState, useEffect } from 'react';
import { canManageWorkNotes, canCreateWorkNotes } from '@/services/workNotes';

export function useWorkNotesPermissions(equipmentId: string) {
  const [canEdit, setCanEdit] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  
  // Check user permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Use simplified permission checks
        const [managePermission, createPermission] = await Promise.all([
          canManageWorkNotes(equipmentId),
          canCreateWorkNotes(equipmentId)
        ]);
        
        setCanEdit(managePermission);
        setCanCreate(createPermission);
      } catch (error) {
        console.error('Error checking permissions:', error);
        // Default to having permissions since RLS is off
        setCanEdit(true);
        setCanCreate(true);
      }
    };
    
    if (equipmentId) {
      checkPermissions();
    }
  }, [equipmentId]);

  return {
    canEdit,
    canCreate
  };
}
