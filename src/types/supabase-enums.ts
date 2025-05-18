
// Type definitions for Supabase enums and custom types

export type UserRole = 'owner' | 'manager' | 'technician' | 'viewer' | 'member';
export type DateTimeFormat = 'MM/DD/YYYY h:mm A' | 'DD/MM/YYYY h:mm A' | 'YYYY-MM-DD HH:mm:ss' | 'ISO';
export type EquipmentStatus = 'active' | 'inactive' | 'maintenance';
export type WorkOrderStatus = 'open' | 'in_progress' | 'closed' | 'on_hold' | 'cancelled';
