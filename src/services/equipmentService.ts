import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getAppUserId, getUserOrganizationId, processDateFields } from "@/utils/authUtils";
import { getEquipmentAttributes, saveEquipmentAttributes } from "./equipmentAttributesService";
import { recordScan } from "./scanService";

/**
 * Get all equipment items including those from teams the user belongs to
 */
export async function getEquipment() {
  try {
    console.log('Fetching all equipment for current user');
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to view equipment');
    }
    
    const authUserId = sessionData.session.user.id;

    // Use the edge function to fetch equipment, which bypasses RLS recursion issues
    const { data, error } = await supabase.functions.invoke('list_user_equipment', {
      body: { user_id: authUserId }
    });
    
    if (error) {
      console.error('Error fetching equipment via edge function:', error);
      throw new Error('Failed to retrieve equipment data');
    }
    
    console.log(`Successfully fetched ${data?.length || 0} equipment items via edge function`);
    return data || [];
  } catch (error) {
    console.error('Error in getEquipment:', error);
    throw error;
  }
}

/**
 * Process equipment list to add team and org names
 */
function processEquipmentList(equipmentList: any[]): Equipment[] {
  return equipmentList.map(item => ({
    ...item,
    team_name: item.team?.name || null,
    org_name: item.org?.name || 'Unknown Organization',
    is_external_org: false, // Default to false for org equipment
  }));
}

/**
 * Get a single equipment by ID with its attributes
 */
export async function getEquipmentById(id: string) {
  try {
    // Get current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to view equipment details');
    }
    
    const authUserId = sessionData.session.user.id;
    
    // Verify access to this equipment
    const { data: accessCheck } = await supabase.functions.invoke('check_equipment_access', {
      body: {
        equipment_id: id,
        user_id: authUserId
      }
    });
    
    if (!accessCheck?.has_access) {
      console.error('User does not have access to this equipment');
      throw new Error('You do not have permission to view this equipment');
    }
    
    // First fetch the equipment
    const { data: equipment, error } = await supabase
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();
      
    if (error) {
      console.error('Error fetching equipment by id:', error);
      throw error;
    }
    
    // Get user's primary organization for determining external orgs
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', authUserId)
      .single();
    
    const userOrgId = userProfile?.org_id;
    const isExternalOrg = equipment.team?.org_id && userOrgId && equipment.team.org_id !== userOrgId;
    
    // Check if user has edit permissions
    let canEdit = !isExternalOrg; // Default: can edit if it's in user's org
    
    if (isExternalOrg) {
      // Get role for this team or org to determine edit permissions
      const { data: teamAccess } = await supabase.functions.invoke('validate_team_access', {
        body: {
          team_id: equipment.team_id,
          user_id: authUserId
        }
      });
      
      // Can edit if manager or higher role
      const editRoles = ['manager', 'creator', 'owner', 'admin'];
      canEdit = teamAccess?.role && editRoles.includes(teamAccess.role);
    }
    
    // Then fetch the attributes
    const attributes = await getEquipmentAttributes(id);
    
    // Return equipment with attributes and extra info
    return {
      ...equipment,
      team_name: equipment.team?.name || null, 
      org_name: equipment.org?.name || 'Unknown Organization',
      is_external_org: isExternalOrg,
      can_edit: canEdit,
      attributes
    } as Equipment;
  } catch (error) {
    console.error('Error in getEquipmentById:', error);
    throw error;
  }
}

/**
 * Create new equipment
 */
export async function createEquipment(equipment: Partial<Equipment>) {
  try {
    // Ensure name is provided as it's required in the database
    if (!equipment.name) {
      throw new Error('Equipment name is required');
    }
    
    // Get the current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to create equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    console.log('Current auth user ID:', authUserId);
    
    // Convert auth user ID to app_user ID
    const appUserId = await getAppUserId(authUserId);
    console.log('Mapped to app_user ID:', appUserId);
    
    let orgId;
    
    // If equipment is for a team, get that team's org_id
    if (equipment.team_id && equipment.team_id !== 'none') {
      console.log(`Getting org ID for team ${equipment.team_id}`);
      
      // Check if user has permission to create equipment for this team
      const { data: permissionCheck } = await supabase.functions.invoke('check_equipment_create_permission', {
        body: {
          user_id: authUserId,
          team_id: equipment.team_id
        }
      });
      
      if (!permissionCheck?.can_create) {
        throw new Error('You do not have permission to create equipment for this team');
      }
      
      // Get team's organization ID
      const { data: team, error: teamError } = await supabase
        .from('team')
        .select('org_id')
        .eq('id', equipment.team_id)
        .single();
        
      if (teamError) {
        console.error('Error fetching team:', teamError);
        throw new Error('Failed to get team information');
      }
      
      orgId = team.org_id;
      console.log(`Using team's org ID: ${orgId}`);
    } else {
      // Use user's organization ID for non-team equipment
      orgId = await getUserOrganizationId(authUserId);
      console.log('Using user org ID:', orgId);
    }
    
    // Extract attributes before sending to database
    const attributes = equipment.attributes || [];
    const equipmentData = { ...equipment };
    delete equipmentData.attributes;
    
    // Process dates and prepare data
    const processedEquipment = processDateFields({
      name: equipment.name,
      model: equipment.model,
      serial_number: equipment.serial_number,
      manufacturer: equipment.manufacturer,
      status: equipment.status || 'active',
      location: equipment.location,
      install_date: equipment.install_date,
      warranty_expiration: equipment.warranty_expiration,
      notes: equipment.notes,
      team_id: equipment.team_id === 'none' ? null : equipment.team_id,
      // Add required fields
      created_by: appUserId, // Using the app_user ID instead of auth user ID
      org_id: orgId
    }, ['install_date', 'warranty_expiration']);
    
    // Create the equipment record
    const { data, error } = await supabase
      .from('equipment')
      .insert(processedEquipment)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
    
    // If we have attributes, insert them
    if (attributes.length > 0) {
      try {
        console.log('Saving attributes:', attributes);
        const savedAttributes = await saveEquipmentAttributes(data.id, attributes);
        return { ...data, attributes: savedAttributes } as Equipment;
      } catch (attrError) {
        console.error('Error adding equipment attributes:', attrError);
        // Return equipment without attributes on attribute error
        return data as Equipment;
      }
    }
    
    return data as Equipment;
  } catch (error) {
    console.error('Error in createEquipment:', error);
    throw error;
  }
}

/**
 * Update existing equipment
 */
export async function updateEquipment(id: string, equipment: Partial<Equipment>) {
  try {
    // Extract attributes before sending to database
    const attributes = equipment.attributes || [];
    const equipmentData = { ...equipment };
    delete equipmentData.attributes;
    
    // Handle 'none' value for team_id
    if (equipmentData.team_id === 'none') {
      equipmentData.team_id = null;
    }
    
    // Process dates and prepare data
    const processedEquipment = processDateFields({
      ...equipmentData,
      updated_at: new Date().toISOString(),
    }, ['install_date', 'warranty_expiration']);
    
    // Update the equipment
    const { data, error } = await supabase
      .from('equipment')
      .update(processedEquipment)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
    
    // Update attributes
    try {
      console.log('Saving updated attributes:', attributes);
      const updatedAttributes = await saveEquipmentAttributes(id, attributes);
      return { ...data, attributes: updatedAttributes } as Equipment;
    } catch (attrError) {
      console.error('Error updating equipment attributes:', attrError);
      // Return equipment without updated attributes on error
      return data as Equipment;
    }
  } catch (error) {
    console.error('Error in updateEquipment:', error);
    throw error;
  }
}

/**
 * Soft delete equipment
 */
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

// Re-export scan service functionality
export { recordScan } from "./scanService";
