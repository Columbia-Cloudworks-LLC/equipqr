
import { z } from 'zod';

export interface Equipment {
  id: string;
  organization_id: string;
  name: string;
  type: string;
  serial_number?: string;
  model_number?: string;
  // Alias used by some parts of the app/tests
  model?: string;
  manufacturer?: string;
  description?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'out_of_service';
  assigned_to?: string;
  assigned_team_id?: string;
  // Alias used by some parts of the app/tests
  team_id?: string;
  location?: string;
  purchase_date?: string;
  warranty_expiration_date?: string;
  // Additional optional fields referenced by form code
  installation_date?: string;
  last_maintenance?: string;
  image_url?: string;
  customer_id?: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  customer_id?: string;
  // Legacy compatibility - map to assigned_team_id
  teamId?: string;
}

export interface CreateEquipmentData {
  name: string;
  type: string;
  serial_number?: string;
  model_number?: string;
  // Alias for compatibility
  model?: string;
  manufacturer?: string;
  description?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'out_of_service';
  assigned_to?: string;
  assigned_team_id?: string;
  // Alias for compatibility
  team_id?: string;
  location?: string;
  purchase_date?: string;
  warranty_expiration_date?: string;
  installation_date?: string;
  last_maintenance?: string;
  image_url?: string;
  customer_id?: string;
  organizationId: string;
  image?: File;
  // Legacy compatibility
  teamId?: string;
}

export interface UpdateEquipmentData {
  name?: string;
  type?: string;
  serial_number?: string;
  model_number?: string;
  // Alias for compatibility
  model?: string;
  manufacturer?: string;
  description?: string;
  notes?: string;
  status?: 'active' | 'inactive' | 'maintenance' | 'out_of_service';
  assigned_to?: string;
  assigned_team_id?: string;
  // Alias for compatibility
  team_id?: string;
  location?: string;
  purchase_date?: string;
  warranty_expiration_date?: string;
  installation_date?: string;
  last_maintenance?: string;
  image_url?: string;
  customer_id?: string;
  // Legacy compatibility
  teamId?: string;
}

export const equipmentSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  type: z.string().min(3, { message: 'Type must be at least 3 characters.' }),
  serial_number: z.string().optional(),
  model_number: z.string().optional(),
  // Accept alias in forms/tests
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'out_of_service']),
  assigned_to: z.string().optional(),
  assigned_team_id: z.string().optional(),
  // Accept alias used by some form sections
  team_id: z.string().optional(),
  location: z.string().optional(),
  purchase_date: z.string().optional(),
  warranty_expiration_date: z.string().optional(),
  // Accept alternative key used by some code
  warranty_expiration: z.string().optional(),
  installation_date: z.string().optional(),
  last_maintenance: z.string().optional(),
  image_url: z.string().optional(),
  customer_id: z.string().optional(),
});

export type EquipmentFormData = z.infer<typeof equipmentSchema>;

// Extend EquipmentRecord with extra optional fields referenced elsewhere
export interface EquipmentRecord extends Equipment {
  team_name?: string;
  customer_name?: string;
  default_pm_template_id?: string | null;
}
