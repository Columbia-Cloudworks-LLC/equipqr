
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getAppUserId, getUserOrganizationId, processDateFields } from "@/utils/authUtils";
import { saveEquipmentAttributes } from "./attributesService";

/**
 * Create new equipment - only for equipment owned by the current user's organization
 * or for teams the user has manager access to
 */
export async function createEquipment(equipment: Partial<Equipment>): Promise<Equipment> {
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
    
    if (!appUserId) {
      throw new Error('Failed to retrieve user profile information');
    }
    
    let orgId;
    
    try {
      // Try the permission check using the edge function first
      if (equipment.team_id && equipment.team_id !== 'none') {
        console.log(`Checking permission to create equipment for team ${equipment.team_id}`);
        
        // Use the permission check edge function
        const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke('check_equipment_permission', {
          body: {
            user_id: authUserId,
            team_id: equipment.team_id, 
            action: 'create'
          }
        });
        
        if (permissionError) {
          console.error('Error from check_equipment_permission edge function:', permissionError);
          throw new Error(`Permission check failed: ${permissionError.message}`);
        }
        
        if (!permissionCheck?.has_permission) {
          const reason = permissionCheck?.reason || 'unknown';
          throw new Error(`You don't have permission to create equipment for this team. Reason: ${reason}`);
        }
        
        // Get the org_id from the response
        orgId = permissionCheck.org_id;
        console.log(`Permission check successful. Using org ID: ${orgId}`);
      } else {
        // For organization-level equipment (no team)
        console.log('Checking permission to create organization-level equipment');
        
        // Use the permission check edge function
        const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke('check_equipment_permission', {
          body: {
            user_id: authUserId,
            action: 'create'
          }
        });
        
        if (permissionError) {
          console.error('Error from check_equipment_permission edge function:', permissionError);
          throw new Error(`Permission check failed: ${permissionError.message}`);
        }
        
        if (!permissionCheck?.has_permission) {
          const reason = permissionCheck?.reason || 'unknown';
          throw new Error(`You don't have permission to create organization equipment. Reason: ${reason}`);
        }
        
        // Get the org_id from the response
        orgId = permissionCheck.org_id;
        console.log(`Permission check successful. Using org ID: ${orgId}`);
      }
    } catch (edgeFnError) {
      // If the edge function fails, fall back to direct checks
      console.error('Edge function error, falling back to direct permission checks:', edgeFnError);
      
      if (equipment.team_id && equipment.team_id !== 'none') {
        // For team equipment, check team permissions directly
        try {
          // Get the team's org_id
          const { data: teamData } = await supabase
            .from('team')
            .select('org_id')
            .eq('id', equipment.team_id)
            .is('deleted_at', null)
            .single();
          
          if (!teamData) {
            throw new Error('Team not found');
          }
          
          orgId = teamData.org_id;
          
          // Check if user has direct permission in this organization
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authUserId)
            .eq('org_id', orgId)
            .maybeSingle();
          
          if (userRoles && (userRoles.role === 'owner' || userRoles.role === 'manager')) {
            console.log(`User has ${userRoles.role} role in organization, permission granted`);
          } else {
            // Check if user is a team manager
            const { data: canAccess } = await supabase.rpc('check_team_access_nonrecursive', {
              p_user_id: authUserId,
              p_team_id: equipment.team_id
            });
            
            if (!canAccess) {
              throw new Error('You do not have access to this team');
            }
            
            // Get team role using our safe function
            const { data: teamRole } = await supabase.rpc('get_team_role_safe', {
              _user_id: authUserId,
              _team_id: equipment.team_id
            });
            
            if (teamRole !== 'manager' && teamRole !== 'owner') {
              throw new Error('You need to be a team manager or owner to create equipment');
            }
          }
        } catch (error) {
          console.error('Team permission check failed:', error);
          throw new Error(`Failed to verify team permissions: ${error.message}`);
        }
      } else {
        // For organization-level equipment, check org permissions directly
        try {
          orgId = await getUserOrganizationId(authUserId);
          
          // Check if user is org manager or owner
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authUserId)
            .eq('org_id', orgId)
            .single();
            
          if (!userRoles || !['owner', 'manager'].includes(userRoles.role)) {
            throw new Error('You need to be an organization manager or owner to create equipment');
          }
        } catch (error) {
          console.error('Organization permission check failed:', error);
          throw new Error(`Failed to verify organization permissions: ${error.message}`);
        }
      }
    }
    
    if (!orgId) {
      throw new Error('Could not determine organization ID for equipment creation');
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
      created_by: appUserId,
      org_id: orgId
    }, ['install_date', 'warranty_expiration']);
    
    console.log('Creating equipment with data:', processedEquipment);
    
    // Create the equipment record
    const { data, error } = await supabase
      .from('equipment')
      .insert(processedEquipment)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating equipment:', error);
      
      // More user-friendly error message for RLS failures
      if (error.message?.includes('new row violates row-level security policy')) {
        throw new Error('Permission denied: You do not have permission to create equipment in this organization');
      }
      
      throw new Error(`Failed to create equipment: ${error.message}`);
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
