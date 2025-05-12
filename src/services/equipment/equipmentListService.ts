
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
