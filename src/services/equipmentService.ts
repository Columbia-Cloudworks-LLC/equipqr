
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";

export async function getEquipment() {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .is('deleted_at', null)
    .order('name');
    
  if (error) {
    console.error('Error fetching equipment:', error);
    throw error;
  }
  
  return data as Equipment[];
}

export async function getEquipmentById(id: string) {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
    
  if (error) {
    console.error('Error fetching equipment by id:', error);
    throw error;
  }
  
  return data as Equipment;
}

export async function createEquipment(equipment: Partial<Equipment>) {
  // Ensure name is provided as it's required in the database
  if (!equipment.name) {
    throw new Error('Equipment name is required');
  }
  
  // Get the current user's ID and organization ID
  const { data: userData } = await supabase.auth.getSession();
  if (!userData.session?.user) {
    throw new Error('User must be logged in to create equipment');
  }
  
  // Get the user profile to determine organization ID
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('org_id')
    .eq('id', userData.session.user.id)
    .single();
    
  if (!userProfile?.org_id) {
    throw new Error('User organization could not be determined');
  }
  
  const { data, error } = await supabase
    .from('equipment')
    .insert({
      name: equipment.name,
      model: equipment.model,
      serial_number: equipment.serial_number,
      manufacturer: equipment.manufacturer,
      status: equipment.status || 'active',
      location: equipment.location,
      install_date: equipment.install_date,
      warranty_expiration: equipment.warranty_expiration,
      team_id: equipment.team_id,
      // Add required fields
      created_by: userData.session.user.id,
      org_id: userProfile.org_id
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating equipment:', error);
    throw error;
  }
  
  return data as Equipment;
}

export async function updateEquipment(id: string, equipment: Partial<Equipment>) {
  const { data, error } = await supabase
    .from('equipment')
    .update({
      ...equipment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating equipment:', error);
    throw error;
  }
  
  return data as Equipment;
}

export async function deleteEquipment(id: string) {
  // Soft delete by setting deleted_at
  const { error } = await supabase
    .from('equipment')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting equipment:', error);
    throw error;
  }
  
  return true;
}

export async function recordScan(equipmentId: string, userId?: string) {
  const { error } = await supabase
    .from('scan_history')
    .insert({
      equipment_id: equipmentId,
      scanned_by_user_id: userId,
    });
    
  if (error) {
    console.error('Error recording scan:', error);
    throw error;
  }
  
  return true;
}
