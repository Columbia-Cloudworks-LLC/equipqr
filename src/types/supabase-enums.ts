
/**
 * Enum for user roles in the application
 */
export type UserRole = 'owner' | 'manager' | 'technician' | 'viewer' | 'member' | 'admin' | 'requestor';

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
 * Modified to match exact formats supported by the database
 */
export type DateTimeFormat = 
  | 'MM/DD/YYYY h:mm A'     // US format
  | 'DD/MM/YYYY h:mm A'     // European format
  | 'YYYY-MM-DD HH:mm:ss'   // ISO-like format
  | 'ISO';                  // Full ISO format

/**
 * Enum for work order status values - updated to match database
 */
export type WorkOrderStatus = 
  | 'submitted' 
  | 'accepted' 
  | 'assigned' 
  | 'in_progress' 
  | 'on_hold' 
  | 'cancelled' 
  | 'completed'
  | 'open'
  | 'closed';
