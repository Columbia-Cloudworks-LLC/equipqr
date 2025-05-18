
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Update an existing team
 * @param id The ID of the team to update
 * @param name The new name for the team
 * @returns The updated team object
 */
export async function updateTeam(id: string, name: string) {
  try {
    if (!id) {
      throw new Error("Team ID is required");
    }
    
    if (!name || name.trim().length === 0) {
      throw new Error("Team name cannot be empty");
    }
    
    const { data, error } = await supabase
      .from('team')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating team:', error);
      throw new Error(`Failed to update team: ${error.message}`);
    }
    
    return data;
  } catch (error: any) {
    console.error('Error in updateTeam:', error);
    throw error;
  }
}
