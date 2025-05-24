import { supabase } from '@/integrations/supabase/client';
import { Equipment, EquipmentAttribute } from '@/types';
import { getEquipmentById } from './equipmentDetailsService';
import { createEquipment } from './equipmentCreateService';
import { saveEquipmentAttributes } from './attributesService';

/**
 * Get the app_user ID for the current authenticated user
 */
async function getCurrentAppUserId(): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Error getting auth session:', sessionError);
    throw new Error('Failed to authenticate user');
  }
  
  if (!sessionData?.session?.user) {
    console.error('User is not authenticated');
    throw new Error('User must be logged in to duplicate equipment');
  }

  const authUserId = sessionData.session.user.id;
  
  // Get the app_user ID that corresponds to this auth user
  const { data: appUser, error: appUserError } = await supabase
    .from('app_user')
    .select('id')
    .eq('auth_uid', authUserId)
    .single();
    
  if (appUserError || !appUser) {
    console.error('Error finding app_user record:', appUserError);
    throw new Error('User profile not found');
  }
  
  return appUser.id;
}

/**
 * Generate a unique name for duplicated equipment using Windows-style naming
 */
async function generateDuplicateName(originalName: string, orgId: string): Promise<string> {
  let counter = 1;
  let newName = `${originalName} (${counter})`;
  
  // Keep checking until we find an available name
  while (true) {
    const { data } = await supabase
      .from('equipment')
      .select('id')
      .eq('name', newName)
      .eq('org_id', orgId)
      .eq('deleted_at', null)
      .single();
    
    if (!data) {
      // Name is available
      return newName;
    }
    
    // Try next number
    counter++;
    newName = `${originalName} (${counter})`;
  }
}

/**
 * Duplicate an equipment record with all its details and attributes
 */
export async function duplicateEquipment(equipmentId: string): Promise<{ equipment: Equipment | null; error: string | null }> {
  try {
    console.log('Starting equipment duplication for ID:', equipmentId);
    
    // Get current app_user ID (not auth user ID)
    const currentAppUserId = await getCurrentAppUserId();
    
    // Get the original equipment with all its details
    const originalEquipment = await getEquipmentById(equipmentId);
    
    if (!originalEquipment) {
      return { equipment: null, error: 'Original equipment not found' };
    }
    
    // Generate a unique name for the duplicate
    const duplicateName = await generateDuplicateName(originalEquipment.name, originalEquipment.org_id);
    
    // Prepare the data for the new equipment (include all required fields)
    const duplicateData = {
      name: duplicateName,
      org_id: originalEquipment.org_id,
      team_id: originalEquipment.team_id,
      status: originalEquipment.status,
      location: originalEquipment.location,
      manufacturer: originalEquipment.manufacturer,
      model: originalEquipment.model,
      serial_number: originalEquipment.serial_number,
      notes: originalEquipment.notes,
      install_date: originalEquipment.install_date,
      warranty_expiration: originalEquipment.warranty_expiration,
      created_by: currentAppUserId, // Use app_user.id, not auth.users.id
    };
    
    console.log('Creating duplicate equipment with data:', duplicateData);
    
    // Create the new equipment record
    const createResult = await createEquipment(duplicateData);
    
    if (createResult.error || !createResult.equipment) {
      return { equipment: null, error: createResult.error || 'Failed to create duplicate equipment' };
    }
    
    const newEquipment = createResult.equipment;
    console.log('Successfully created duplicate equipment:', newEquipment);
    
    // Copy all custom attributes if they exist
    if (originalEquipment.attributes && originalEquipment.attributes.length > 0) {
      console.log('Copying custom attributes:', originalEquipment.attributes);
      
      // Prepare attributes for the new equipment (remove IDs so new ones are generated)
      const attributesToCopy = originalEquipment.attributes.map(attr => ({
        equipment_id: newEquipment.id,
        key: attr.key,
        value: attr.value,
        id: `temp-${Date.now()}-${Math.random()}` // Temporary ID
      }));
      
      try {
        await saveEquipmentAttributes(newEquipment.id, attributesToCopy);
        console.log('Successfully copied custom attributes');
      } catch (attributeError) {
        console.warn('Failed to copy custom attributes:', attributeError);
        // Don't fail the entire operation if attributes fail to copy
      }
    }
    
    return { equipment: newEquipment, error: null };
    
  } catch (error: any) {
    console.error('Error duplicating equipment:', error);
    return { equipment: null, error: error.message || 'Failed to duplicate equipment' };
  }
}
