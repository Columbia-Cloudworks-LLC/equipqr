import { z } from 'zod';

// Custom attributes schema for better type safety
const customAttributesSchema = z.record(z.string(), z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null()
])).optional();

// Location schema for last_known_location
const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  timestamp: z.string().optional()
}).optional();

// Context for role-based validation
export interface EquipmentValidationContext {
  userRole: 'owner' | 'admin' | 'manager' | 'member';
  isOrgAdmin: boolean;
  teamMemberships: Array<{ teamId: string; role: string }>;
}

export const equipmentFormSchema = z.object({
  name: z.string().min(1, "Equipment name is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  model: z.string().min(1, "Model is required"),
  serial_number: z.string().min(1, "Serial number is required"),
  status: z.enum(['active', 'maintenance', 'inactive']),
  location: z.string().min(1, "Location is required"),
  installation_date: z.string(),
  warranty_expiration: z.string().optional(),
  last_maintenance: z.string().optional(),
  notes: z.string(),
  custom_attributes: customAttributesSchema,
  image_url: z.string().optional(),
  last_known_location: locationSchema,
  team_id: z.string().optional(),
  default_pm_template_id: z.string().optional()
});

// Function to create context-aware validation
export const createEquipmentValidationSchema = (context?: EquipmentValidationContext) => {
  return equipmentFormSchema.refine((data) => {
    // If no context provided, skip team validation (for backward compatibility)
    if (!context) return true;
    
    // Org admins and owners can create equipment without team assignment
    if (context.isOrgAdmin || context.userRole === 'owner') {
      return true;
    }
    
    // Non-admin users must assign equipment to a team they manage
    if (!data.team_id) {
      return false;
    }
    
    // Validate user can manage the assigned team
    const canManageTeam = context.teamMemberships.some(
      membership => membership.teamId === data.team_id && 
      (membership.role === 'manager' || membership.role === 'admin')
    );
    
    return canManageTeam;
  }, {
    message: "You must assign equipment to a team you manage",
    path: ["team_id"]
  });
};

export type EquipmentFormData = z.infer<typeof equipmentFormSchema>;

// Strongly-typed Equipment record used across forms and pages (DB shape)
export interface EquipmentRecord {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: 'active' | 'maintenance' | 'inactive';
  location: string;
  installation_date: string;
  warranty_expiration: string | null;
  last_maintenance: string | null;
  notes?: string | null;
  custom_attributes?: Record<string, string | number | boolean | null>;
  image_url?: string | null;
  last_known_location?: {
    latitude: number;
    longitude: number;
    address?: string;
    timestamp?: string;
  } | null;
  team_id?: string | null;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
  // Optional app-specific fields
  working_hours?: number;
  default_pm_template_id?: string | null;
}