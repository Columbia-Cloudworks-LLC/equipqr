
/**
 * Enum for user roles in the application
 */
export type UserRole = 'viewer' | 'technician' | 'manager' | 'owner' | 'admin';

/**
 * Enum for equipment status values
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
