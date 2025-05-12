
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getAppUserId, getUserOrganizationId, processDateFields } from "@/utils/authUtils";
import { getEquipmentAttributes, saveEquipmentAttributes } from "@/services/equipmentAttributesService";
import { recordScan } from "@/services/scanService";

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
      return []; // Return empty array instead of throwing
    }
    
    // Ensure we always have a valid array to work with
    const equipmentArray = Array.isArray(data) ? data : [];
    console.log(`Successfully fetched ${equipmentArray.length} equipment items via edge function`);
    
    return equipmentArray;
  } catch (error) {
    console.error('Error in getEquipment:', error);
    return []; // Return empty array on error
  }
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
      // If from an external org, need to check specific permissions
      const { data: teamAccess } = await supabase.functions.invoke('check_team_role_permission', {
        body: {
          user_id: authUserId,
          team_id: equipment.team_id
        }
      });
      
      // Can edit if manager or higher role
      const editRoles = ['manager', 'owner', 'admin'];
      canEdit = teamAccess?.hasPermission && teamAccess?.role && editRoles.includes(teamAccess.role);
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
      
      // Use the edge function to check permission instead of direct DB access
      // This avoids RLS recursion issues
      const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke('check_equipment_create_permission', {
        body: {
          user_id: authUserId,
          team_id: equipment.team_id
        }
      });
      
      if (permissionError) {
        console.error('Error checking equipment creation permission:', permissionError);
        throw new Error('Failed to verify permissions');
      }
      
      if (!permissionCheck?.can_create) {
        throw new Error('You do not have permission to create equipment for this team');
      }
      
      // Get the org_id from the response
      orgId = permissionCheck.org_id;
      
      if (!orgId) {
        throw new Error('Failed to determine organization for this team');
      }
      
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

// Re-export scan service functionality
export { recordScan } from "@/services/scanService";
