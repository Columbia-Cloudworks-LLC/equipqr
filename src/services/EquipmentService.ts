import { supabase } from '@/integrations/supabase/client';
import { Equipment, CreateEquipmentData, UpdateEquipmentData } from '@/types/equipment';

// Function-style API (used by UI)
export const createEquipment = async (data: CreateEquipmentData): Promise<Equipment> => {
  const equipmentData = {
    organization_id: data.organizationId,
    name: data.name,
    manufacturer: data.manufacturer || '',
    model: data.model || '',
    serial_number: data.serial_number || '',
    status: data.status,
    location: data.location || '',
    installation_date: data.installation_date || new Date().toISOString().split('T')[0],
    warranty_expiration: data.warranty_expiration || null,
    last_maintenance: data.last_maintenance || null,
    notes: data.notes || '',
    custom_attributes: data.custom_attributes || {},
    image_url: data.image_url || null,
    last_known_location: data.last_known_location || null,
    team_id: data.team_id || data.teamId || null,
    customer_id: data.customer_id || null,
    working_hours: data.working_hours || 0,
    default_pm_template_id: data.default_pm_template_id || null,
    import_id: data.import_id || null,
  } as const;

  const { data: inserted, error } = await supabase
    .from('equipment')
    .insert([equipmentData])
    .select()
    .single();

  if (error) throw error;
  // Ensure required "type" for our local type, fallback to 'General'
  return { type: 'General', ...(inserted as any) } as Equipment;
};

export const updateEquipment = async (id: string, data: UpdateEquipmentData): Promise<Equipment> => {
  const updateData = {
    name: data.name,
    manufacturer: data.manufacturer,
    model: data.model,
    serial_number: data.serial_number,
    status: data.status,
    location: data.location,
    installation_date: data.installation_date,
    warranty_expiration: data.warranty_expiration,
    last_maintenance: data.last_maintenance,
    notes: data.notes,
    custom_attributes: data.custom_attributes,
    image_url: data.image_url,
    last_known_location: data.last_known_location,
    team_id: data.team_id || data.teamId,
    customer_id: data.customer_id,
    working_hours: data.working_hours,
    default_pm_template_id: data.default_pm_template_id,
  } as const;

  const { data: updated, error } = await supabase
    .from('equipment')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { type: 'General', ...(updated as any) } as Equipment;
};

export const getEquipment = async (id: string): Promise<Equipment> => {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return { type: 'General', ...(data as any) } as Equipment;
};

export const deleteEquipment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Class-style API (used by tests)
export class EquipmentService {
  constructor(private organizationId: string) {}

  async getAll(
    filters: { status?: 'active' | 'maintenance' | 'inactive'; location?: string } = {},
    pagination: { page?: number; limit?: number } = {}
  ) {
    let query = supabase.from('equipment').select('*').eq('organization_id', this.organizationId);

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.location) {
      query = query.eq('location', filters.location);
    }

    const limit = pagination.limit ?? 50;
    const page = pagination.page ?? 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error } = await query;
    if (error) return { success: false as const, error };

    return { success: true as const, data: (data || []).map((e: any) => ({ type: 'General', ...e })) };
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('id', id)
      .single();

    if (error) return { success: false as const, error };
    return { success: true as const, data: { type: 'General', ...(data as any) } };
  }

  async create(payload: any) {
    try {
      const created = await createEquipment({ organizationId: this.organizationId, ...payload });
      return { success: true as const, data: created };
    } catch (error) {
      return { success: false as const, error };
    }
  }

  async update(id: string, payload: any) {
    try {
      const updated = await updateEquipment(id, payload);
      return { success: true as const, data: updated };
    } catch (error) {
      return { success: false as const, error };
    }
  }

  async delete(id: string) {
    try {
      await deleteEquipment(id);
      return { success: true as const, data: true };
    } catch (error) {
      return { success: false as const, error };
    }
  }

  async getStatusCounts() {
    const { data, error } = await supabase
      .from('equipment')
      .select('status')
      .eq('organization_id', this.organizationId);

    if (error) return { success: false as const, error };

    const counts = { active: 0, maintenance: 0, inactive: 0 } as Record<string, number>;
    (data || []).forEach((row: any) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
    });

    return { success: true as const, data: counts };
  }
}
