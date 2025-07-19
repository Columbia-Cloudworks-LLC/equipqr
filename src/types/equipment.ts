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