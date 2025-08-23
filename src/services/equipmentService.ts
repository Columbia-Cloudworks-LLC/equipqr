
import { supabase } from '@/integrations/supabase/client';
import { CreateEquipmentData, UpdateEquipmentData, Equipment } from '@/types/equipment';

export async function createEquipment(data: CreateEquipmentData): Promise<Equipment> {
  const equipmentData = {
    organization_id: data.organizationId,
    name: data.name,
    type: data.type || 'General',
    description: data.description,
    status: data.status || 'active',
    assigned_team_id: data.teamId || data.assigned_team_id,
    customer_id: data.customer_id,
    serial_number: data.serial_number,
    model_number: data.model_number,
    manufacturer: data.manufacturer,
    notes: data.notes,
    location: data.location,
    purchase_date: data.purchase_date,
    warranty_expiration_date: data.warranty_expiration_date,
  };

  const { data: equipment, error } = await supabase
    .from('equipment')
    .insert(equipmentData)
    .select()
    .single();

  if (error) throw error;
  return equipment;
}

export async function updateEquipment(id: string, data: UpdateEquipmentData): Promise<Equipment> {
  const updateData: any = { ...data };
  
  // Handle legacy teamId field
  if (data.teamId) {
    updateData.assigned_team_id = data.teamId;
    delete updateData.teamId;
  }
  
  delete updateData.organizationId;
  delete updateData.image;

  const { data: equipment, error } = await supabase
    .from('equipment')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return equipment;
}
