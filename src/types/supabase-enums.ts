
/**
 * Enum for user roles in the application
 */
export type UserRole = 'owner' | 'manager' | 'technician' | 'viewer' | 'member' | 'admin';

/**
 * Enum for equipment status values
 * Database now supports all five options: 'active', 'inactive', 'maintenance', 'storage', 'retired'
 */
export type EquipmentStatus = 'active' | 'inactive' | 'maintenance' | 'storage' | 'retired';

/**
 * Enum for invitation status values
 */
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired' | 'sent';

/**
 * Enum for note visibility
 */
export type NoteVisibility = 'public' | 'private';

/**
 * Enum for team member status
 */
export type MemberStatus = 'active' | 'inactive' | 'pending';

/**
 * Enum for datetime format preferences
 */
export type DateTimeFormat = 
  | 'MM/DD/YYYY h:mm A'     // US format
  | 'DD/MM/YYYY h:mm A'     // European format
  | 'YYYY-MM-DD HH:mm'      // ISO-like format
  | 'YYYY-MM-DD HH:mm:ss'   // Extended ISO format
  | 'ISO';                  // Full ISO format
