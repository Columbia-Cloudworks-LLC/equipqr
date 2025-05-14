
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getAppUserId, getUserOrganizationId, processDateFields } from "@/utils/authUtils";
import { saveEquipmentAttributes } from "../equipmentAttributesService";

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
    
    // If equipment is for a team, get that team's org_id and check permissions through RLS
    if (equipment.team_id && equipment.team_id !== 'none') {
      console.log(`Getting org ID for team ${equipment.team_id}`);
      
      // Get the team's org_id
      const { data: team, error: teamError } = await supabase
        .from('team')
        .select('org_id, name')
        .eq('id', equipment.team_id)
        .single();
        
      if (teamError) {
        console.error('Error fetching team details:', teamError);
        throw new Error('Failed to get team details: ' + teamError.message);
      }
      
      if (!team) {
        throw new Error('Team not found');
      }
      
      // Get app_user's ID for team membership check
      const { data: appUserRecord } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', authUserId)
        .single();
      
      if (!appUserRecord) {
        throw new Error('User record not found');
      }
      
      // Check if user is a team member with RLS
      const { data: teamMember, error: memberError } = await supabase
        .from('team_member')
        .select('id')
        .eq('team_id', equipment.team_id)
        .eq('user_id', appUserRecord.id)
        .maybeSingle();
      
      if (memberError) {
        console.error('Error checking team membership:', memberError);
      }
      
      // Check team role if user is a member
      if (teamMember) {
        const { data: teamRole } = await supabase
          .from('team_roles')
          .select('role')
          .eq('team_member_id', teamMember.id)
          .maybeSingle();
          
        const role = teamRole?.role;
        
        if (!role || !['manager', 'owner', 'admin', 'creator'].includes(role)) {
          throw new Error(`You need manager or higher role to create equipment for team ${team.name}`);
        }
      } else {
        // If not a team member, check if user belongs to the same org as team
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('org_id')
          .eq('id', authUserId)
          .single();
          
        if (userProfile?.org_id !== team.org_id) {
          throw new Error('You do not have permission to create equipment for this team');
        }
        
        // Check if user has required role in the organization
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUserId)
          .eq('org_id', team.org_id)
          .maybeSingle();
          
        const orgRole = userRoles?.role;
        
        if (!orgRole || !['owner', 'manager'].includes(orgRole)) {
          throw new Error('You need to be an organization manager or owner to create equipment for teams');
        }
      }
      
      orgId = team.org_id;
    } else {
      // Use user's organization ID for non-team equipment
      orgId = await getUserOrganizationId(authUserId);
      console.log('Using user org ID:', orgId);
      
      // Verify user has permission in their organization
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUserId)
        .eq('org_id', orgId)
        .maybeSingle();
        
      const orgRole = userRoles?.role;
      
      if (!orgRole || !['owner', 'manager'].includes(orgRole)) {
        throw new Error('You need to be an organization manager or owner to create equipment');
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
