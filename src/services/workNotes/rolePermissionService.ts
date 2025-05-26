
import { supabase } from "@/integrations/supabase/client";
import { getUserRoleForEquipment, EquipmentUserRole } from '@/services/equipment/equipmentRoleService';

export interface RoleBasedWorkNotePermissions {
  canCreate: boolean;
  canCreatePrivate: boolean;
  canEnterHours: boolean;
  canViewPrivate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  userRole: EquipmentUserRole;
}

/**
 * Get role-based work note permissions for specific equipment
 */
export async function getRoleBasedWorkNotePermissions(equipmentId: string): Promise<RoleBasedWorkNotePermissions> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData?.session?.user) {
      return {
        canCreate: false,
        canCreatePrivate: false,
        canEnterHours: false,
        canViewPrivate: false,
        canEdit: false,
        canDelete: false,
        userRole: 'none'
      };
    }
    
    // Get user role for this equipment
    const userRole = await getUserRoleForEquipment(equipmentId);
    
    // Define permissions based on role
    const permissions = {
      canCreate: ['manager', 'technician', 'requestor'].includes(userRole),
      canCreatePrivate: ['manager', 'technician'].includes(userRole),
      canEnterHours: ['manager', 'technician'].includes(userRole),
      canViewPrivate: ['manager', 'technician'].includes(userRole),
      canEdit: ['manager', 'technician'].includes(userRole),
      canDelete: ['manager', 'technician'].includes(userRole),
      userRole
    };
    
    return permissions;
  } catch (error) {
    console.error("Error getting role-based work note permissions:", error);
    return {
      canCreate: false,
      canCreatePrivate: false,
      canEnterHours: false,
      canViewPrivate: false,
      canEdit: false,
      canDelete: false,
      userRole: 'none'
    };
  }
}

/**
 * Check if user can edit a specific work note based on role and time constraints
 */
export async function canEditWorkNote(noteId: string, equipmentId: string): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      return false;
    }

    // Get role-based permissions
    const permissions = await getRoleBasedWorkNotePermissions(equipmentId);
    
    if (!permissions.canEdit) {
      return false;
    }

    // Get the note details
    const { data: note, error } = await supabase
      .from('equipment_work_notes')
      .select('created_by, created_at')
      .eq('id', noteId)
      .single();

    if (error || !note) {
      return false;
    }

    // Check if user is the author
    if (note.created_by !== userId) {
      return false;
    }

    // Check 24-hour edit window
    const createdAt = new Date(note.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff <= 24;
  } catch (error) {
    console.error('Error checking work note edit permission:', error);
    return false;
  }
}
