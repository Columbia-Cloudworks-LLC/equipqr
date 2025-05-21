
import { supabase } from "@/integrations/supabase/client";
import { retry } from "@/utils/edgeFunctions/retry";
import { EquipmentFormValues } from "@/types/equipment";
import { CreateEquipmentParams } from "@/types/equipment";
import { toast } from "sonner";
import { checkCreatePermission, fallbackPermissionCheck } from "./permissions";

/**
 * Create new equipment record
 */
export async function createEquipment(data: EquipmentFormValues) {
  try {
    // Check if there's a session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to create equipment.');
    }
    
    // Check if the data is valid
    if (!data.name) {
      throw new Error('Equipment name is required');
    }
    
    const targetOrgId = data.org_id;
    const targetTeamId = data.team_id === 'none' ? null : data.team_id;
    
    // Check permission through edge function
    const permCheck = await retry(() => 
      supabase.functions.invoke('check_equipment_create_permission', {
        body: { 
          org_id: targetOrgId,
          team_id: targetTeamId 
        }
      }), 3);
    
    const permission = permCheck?.data;
    
    if (!permission || !permission.has_permission) {
      // Try fallback permission check
      const hasFallbackPermission = await fallbackPermissionCheck(targetOrgId);
      
      if (!hasFallbackPermission) {
        throw new Error('You do not have permission to create equipment');
      }
      
      console.log('Using fallback permission check');
    }
    
    // Create the equipment
    const { data: equipment, error } = await supabase
      .from('equipment')
      .insert({
        name: data.name,
        model: data.model,
        serial_number: data.serialNumber,
        manufacturer: data.manufacturer,
        status: data.status,
        location: data.location,
        install_date: data.installDate,
        warranty_expiration: data.warrantyExpiration,
        notes: data.notes,
        org_id: targetOrgId,
        team_id: targetTeamId,
        created_by: sessionData.session.user.id
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
    
    // Create custom attributes if there are any
    if (data.attributes && data.attributes.length > 0) {
      const attributes = data.attributes.filter(attr => attr.key && attr.value);
      
      if (attributes.length > 0) {
        const attributeRecords = attributes.map(attr => ({
          equipment_id: equipment.id,
          key: attr.key,
          value: attr.value
        }));
        
        const { error: attrError } = await supabase
          .from('equipment_attributes')
          .insert(attributeRecords);
          
        if (attrError) {
          console.error('Error saving attributes:', attrError);
        }
      }
    }
    
    toast.success(`${data.name} created`, {
      description: "Equipment record has been created successfully"
    });
    
    return equipment;
  } catch (error: any) {
    console.error('Error in createEquipment:', error);
    
    toast.error("Failed to create equipment", {
      description: error.message || "An unknown error occurred"
    });
    
    throw error;
  }
}
