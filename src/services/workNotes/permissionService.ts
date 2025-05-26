
import { WorkNotePermissions } from './types';

/**
 * Get work note permissions for a user on specific equipment
 */
export async function getWorkNotePermissions(equipmentId: string): Promise<WorkNotePermissions> {
  // This is a placeholder implementation
  // In a real app, this would check user roles and team memberships
  
  try {
    // For now, return basic permissions
    // This should be replaced with actual permission checking logic
    return {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canViewPrivate: true
    };
  } catch (error) {
    console.error('Error checking work note permissions:', error);
    // Return restrictive permissions on error
    return {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canViewPrivate: false
    };
  }
}

/**
 * Check if a user can edit a specific work note
 */
export function canEditWorkNote(note: any, userId: string): boolean {
  // Can only edit own notes within 24 hours
  if (note.created_by !== userId) {
    return false;
  }
  
  const createdAt = new Date(note.created_at);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceCreation <= 24;
}

/**
 * Check if a user can manage work notes for specific equipment
 */
export async function canManageWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    const permissions = await getWorkNotePermissions(equipmentId);
    return permissions.canEdit && permissions.canDelete;
  } catch (error) {
    console.error('Error checking manage permissions:', error);
    return false;
  }
}

/**
 * Check if a user can create work notes for specific equipment
 */
export async function canCreateWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    const permissions = await getWorkNotePermissions(equipmentId);
    return permissions.canCreate;
  } catch (error) {
    console.error('Error checking create permissions:', error);
    return false;
  }
}
