
import { useState, useEffect } from 'react';
import { canManageWorkNotes, canCreateWorkNotes } from '@/services/workNotes';

export function useWorkNotesPermissions(equipmentId: string) {
  const [canEdit, setCanEdit] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  
  // Check user permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        console.log('Checking work notes permissions for equipment:', equipmentId);
        
        const [managePermission, createPermission] = await Promise.all([
          canManageWorkNotes(equipmentId),
          canCreateWorkNotes(equipmentId)
        ]);
        
        console.log('Work notes permissions:', { 
          canEdit: managePermission, 
          canCreate: createPermission 
        });
        
        setCanEdit(managePermission);
        setCanCreate(createPermission);
      } catch (error) {
        console.error('Error checking work notes permissions:', error);
        // Default to no permissions on error
        setCanEdit(false);
        setCanCreate(false);
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
