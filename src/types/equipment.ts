
import { z } from 'zod';

export interface Equipment {
  id: string;
  organization_id: string;
  name: string;
  type?: string;
  serial_number?: string;
  model_number?: string;
  model?: string;
  manufacturer?: string;
  description?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'maintenance';
  assigned_to?: string;
  assigned_team_id?: string;
  team_id?: string;
  location?: string;
  purchase_date?: string;
  warranty_expiration?: string;
  installation_date?: string;
  last_maintenance?: string;
  image_url?: string;
  customer_id?: string;
  created_at: string;
  updated_at: string;
  teamId?: string;
  custom_attributes?: Record<string, any>;
  last_known_location?: any;
  working_hours?: number;
  default_pm_template_id?: string | null;
  import_id?: string | null;
}

export interface CreateEquipmentData {
  name: string;
  type?: string;
  serial_number?: string;
  model_number?: string;
  model?: string;
  manufacturer?: string;
  description?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'maintenance';
  assigned_to?: string;
  assigned_team_id?: string;
  team_id?: string;
  location?: string;
  purchase_date?: string;
  warranty_expiration?: string;
  installation_date?: string;
  last_maintenance?: string;
  image_url?: string;
  customer_id?: string;
  organizationId: string;
  image?: File;
  teamId?: string;
  custom_attributes?: Record<string, any>;
  last_known_location?: any;
  working_hours?: number;
  default_pm_template_id?: string | null;
  import_id?: string | null;
}

export interface UpdateEquipmentData {
  name?: string;
  type?: string;
  serial_number?: string;
  model_number?: string;
  model?: string;
  manufacturer?: string;
  description?: string;
  notes?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  assigned_to?: string;
  assigned_team_id?: string;
  team_id?: string;
  location?: string;
  purchase_date?: string;
  warranty_expiration?: string;
  installation_date?: string;
  last_maintenance?: string;
  image_url?: string;
  customer_id?: string;
  teamId?: string;
  custom_attributes?: Record<string, any>;
  last_known_location?: any;
  working_hours?: number;
  default_pm_template_id?: string | null;
}

const baseEquipmentSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  manufacturer: z.string().min(1, { message: 'Manufacturer is required.' }),
  model: z.string().min(1, { message: 'Model is required.' }),
  serial_number: z.string().min(1, { message: 'Serial number is required.' }),
  status: z.enum(['active', 'inactive', 'maintenance']),
  location: z.string().min(1, { message: 'Location is required.' }),
  installation_date: z.string().optional(),
  warranty_expiration: z.string().optional(),
  last_maintenance: z.string().optional(),
  notes: z.string().optional(),
  image_url: z.string().optional(),
  team_id: z.string().optional(),
  customer_id: z.string().optional(),
  custom_attributes: z.record(z.any()).optional(),
  last_known_location: z.any().optional(),
  default_pm_template_id: z.string().optional().nullable(),
});

export const createEquipmentValidationSchema = (context: any) => baseEquipmentSchema;

export type EquipmentValidationContext = {
  userRole: 'owner' | 'admin' | 'manager' | 'member';
  isOrgAdmin: boolean;
  teamMemberships: Array<{ teamId: string; role: string }>;
};

export const equipmentSchema = baseEquipmentSchema.extend({
  type: z.string().min(3, { message: 'Type must be at least 3 characters.' }),
  assigned_to: z.string().optional(),
  assigned_team_id: z.string().optional(),
  purchase_date: z.string().optional(),
});

export type EquipmentFormData = z.infer<typeof baseEquipmentSchema>;

export interface EquipmentRecord extends Equipment {
  team_name?: string;
  customer_name?: string;
}
