
import { supabase } from "@/integrations/supabase/client";
import { Equipment, EquipmentAttribute } from "@/types";

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
  // First fetch the equipment
  const { data: equipment, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
    
  if (error) {
    console.error('Error fetching equipment by id:', error);
    throw error;
  }
  
  // Then fetch the attributes
  const { data: attributes, error: attributesError } = await supabase
    .from('equipment_attributes')
    .select('*')
    .eq('equipment_id', id)
    .order('key');
    
  if (attributesError) {
    console.error('Error fetching equipment attributes:', attributesError);
    // Don't throw here, we'll just return equipment without attributes
  }
  
  // Return equipment with attributes
  return {
    ...equipment,
    attributes: attributes || []
  } as Equipment;
}

export async function createEquipment(equipment: Partial<Equipment>) {
  try {
    // Ensure name is provided as it's required in the database
    if (!equipment.name) {
      throw new Error('Equipment name is required');
    }
    
    // Get the current user's ID and organization ID
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session?.user) {
      throw new Error('User must be logged in to create equipment');
    }
    
    // Extract attributes before sending to database
    const attributes = equipment.attributes || [];
    const equipmentData = { ...equipment };
    delete equipmentData.attributes;
    
    // Get the user profile to determine organization ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userData.session.user.id)
      .single();
    
    if (profileError || !userProfile?.org_id) {
      console.error('Error fetching user profile:', profileError);
      throw new Error('Failed to determine your organization. Please ensure your profile is set up correctly.');
    }
    
    // Start a transaction for equipment and attributes
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
        notes: equipment.notes,
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
    
    // If we have attributes, insert them
    if (attributes.length > 0) {
      const attributesWithEquipmentId = attributes.map(attr => ({
        ...attr,
        equipment_id: data.id
      }));
      
      const { error: attrError } = await supabase
        .from('equipment_attributes')
        .insert(attributesWithEquipmentId);
        
      if (attrError) {
        console.error('Error adding equipment attributes:', attrError);
        // Don't throw here, we'll return the equipment without attributes
      }
      
      // Fetch the created attributes
      const { data: createdAttributes } = await supabase
        .from('equipment_attributes')
        .select('*')
        .eq('equipment_id', data.id);
        
      // Return equipment with attributes
      return { ...data, attributes: createdAttributes || [] } as Equipment;
    }
    
    return data as Equipment;
  } catch (error) {
    console.error('Error in createEquipment:', error);
    throw error;
  }
}

export async function updateEquipment(id: string, equipment: Partial<Equipment>) {
  try {
    // Extract attributes before sending to database
    const attributes = equipment.attributes || [];
    const equipmentData = { ...equipment };
    delete equipmentData.attributes;
    
    // Update the equipment
    const { data, error } = await supabase
      .from('equipment')
      .update({
        ...equipmentData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
    
    // Handle attributes - first get existing attributes
    const { data: existingAttributes } = await supabase
      .from('equipment_attributes')
      .select('*')
      .eq('equipment_id', id);
    
    // Process each attribute - update or add new ones
    for (const attr of attributes) {
      if (attr.id) {
        // Update existing attribute
        await supabase
          .from('equipment_attributes')
          .update({
            key: attr.key,
            value: attr.value,
            updated_at: new Date().toISOString()
          })
          .eq('id', attr.id);
      } else {
        // Add new attribute
        await supabase
          .from('equipment_attributes')
          .insert({
            equipment_id: id,
            key: attr.key,
            value: attr.value
          });
      }
    }
    
    // Delete attributes not in the updated list
    if (existingAttributes) {
      const updatedIds = attributes.filter(a => a.id).map(a => a.id);
      const toDelete = existingAttributes.filter(a => !updatedIds.includes(a.id));
      
      if (toDelete.length > 0) {
        await supabase
          .from('equipment_attributes')
          .delete()
          .in('id', toDelete.map(a => a.id));
      }
    }
    
    // Return equipment with updated attributes
    const { data: updatedAttributes } = await supabase
      .from('equipment_attributes')
      .select('*')
      .eq('equipment_id', id);
      
    return { ...data, attributes: updatedAttributes || [] } as Equipment;
  } catch (error) {
    console.error('Error in updateEquipment:', error);
    throw error;
  }
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
