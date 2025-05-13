
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";

/**
 * Get all equipment items including those from teams the user belongs to
 */
export async function getEquipment(): Promise<Equipment[]> {
  try {
    console.log('Fetching all equipment for current user');
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to view equipment');
    }

    const userId = sessionData.session.user.id;
    
    // Use the edge function to get equipment
    const { data, error } = await supabase.functions.invoke('list_user_equipment', {
      body: { user_id: userId }
    });
    
    if (error) {
      console.error('Error fetching equipment via edge function:', error);
      
      // Fallback to direct query if the edge function fails
      return getEquipmentDirectQuery();
    }
    
    // Validate that we received an array
    if (!Array.isArray(data)) {
      console.error('Invalid response from list_user_equipment function:', data);
      return [];
    }
    
    console.log(`Successfully fetched ${data.length} equipment items via edge function`);
    return data;
  } catch (error) {
    console.error('Error in getEquipment:', error);
    
    // Fallback to direct query if there's an exception
    try {
      return await getEquipmentDirectQuery();
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return []; 
    }
  }
}

/**
 * Fallback function using direct query if edge function fails
 */
async function getEquipmentDirectQuery(): Promise<Equipment[]> {
  try {
    console.log('Using fallback direct query for equipment');
    
    // Direct query using the RLS policies
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .is('deleted_at', null)
      .order('name');
    
    if (error) {
      console.error('Error in direct equipment query:', error);
      return []; 
    }
    
    console.log(`Successfully fetched ${data?.length || 0} equipment items via direct query`);
    return processEquipmentList(data || []);
  } catch (error) {
    console.error('Error in getEquipmentDirectQuery:', error);
    return []; 
  }
}

/**
 * Process equipment list to add team and org names
 */
export function processEquipmentList(equipmentList: any[]): Equipment[] {
  return equipmentList.map(item => ({
    ...item,
    team_name: item.team?.name || null,
    org_name: item.org?.name || 'Unknown Organization',
    is_external_org: false, // Default to false for org equipment
  }));
}
