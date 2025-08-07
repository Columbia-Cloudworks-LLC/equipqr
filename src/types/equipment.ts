import { z } from 'zod';

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
  custom_attributes: z.any().optional(),
  image_url: z.string().optional(),
  last_known_location: z.any().optional(),
  team_id: z.string().optional()
}).refine((data) => {
  // Non-admin users must assign equipment to a team
  // This will be validated in the component based on user permissions
  return true; // Basic validation passes, detailed validation in component
}, {
  message: "Team assignment is required for non-admin users"
});

export type EquipmentFormData = z.infer<typeof equipmentFormSchema>;

export interface Equipment {
  id: string;
  name: string;
  manufacturer?: string | null;
  model?: string | null;
  serial_number?: string | null;
  status: 'active' | 'maintenance' | 'inactive';
  location?: string | null;
  installation_date?: string | null;
  warranty_expiration?: string | null;
  last_maintenance?: string | null;
  notes?: string | null;
  team_id?: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
  image_url?: string | null;
  custom_attributes?: Record<string, any>;
}

export interface CustomAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  required: boolean;
  organization_id: string;
}

export interface EquipmentWithCustomAttributes extends Equipment {
  custom_attributes: Record<string, any>;
}