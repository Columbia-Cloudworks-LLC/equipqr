
import { supabase } from '@/integrations/supabase/client';
import { Equipment, CreateEquipmentData, UpdateEquipmentData } from '@/types/equipment';

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
    warranty_expiration_date: data.warranty_expiration_date || null,
    last_maintenance: data.last_maintenance || null,
    notes: data.notes || '',
    custom_attributes: data.custom_attributes || {},
    image_url: data.image_url || null,
    last_known_location: data.last_known_location || null,
    team_id: data.team_id || data.teamId || null,
    customer_id: data.customer_id || null,
    working_hours: data.working_hours || 0,
    default_pm_template_id: data.default_pm_template_id || null,
    import_id: data.import_id || null
  };

  const { data: equipment, error } = await supabase
    .from('equipment')
    .insert([equipmentData])
    .select()
    .single();

  if (error) throw error;
  return equipment;
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
    warranty_expiration_date: data.warranty_expiration_date,
    last_maintenance: data.last_maintenance,
    notes: data.notes,
    custom_attributes: data.custom_attributes,
    image_url: data.image_url,
    last_known_location: data.last_known_location,
    team_id: data.team_id || data.teamId,
    customer_id: data.customer_id,
    working_hours: data.working_hours,
    default_pm_template_id: data.default_pm_template_id
  };

  const { data: equipment, error } = await supabase
    .from('equipment')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return equipment;
};

export const getEquipment = async (id: string): Promise<Equipment> => {
  const { data: equipment, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return equipment;
};

export const deleteEquipment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
