
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

    // Direct query using the RLS policies now - no need for edge function
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
      console.error('Error fetching equipment:', error);
      return []; 
    }
    
    console.log(`Successfully fetched ${data?.length || 0} equipment items`);
    return processEquipmentList(data || []);
  } catch (error) {
    console.error('Error in getEquipment:', error);
    return []; // Return empty array on error
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
