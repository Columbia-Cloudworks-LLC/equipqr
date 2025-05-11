
// Re-export all invitation-related functions from the invitation directory
export * from "./invitation";

// Add new functionality to check if a user is a member of a team
export async function isUserTeamMember(userId: string, teamId: string): Promise<boolean> {
  try {
    if (!userId || !teamId) return false;
    
    // Use the existing validateTeamMembership function
    const { validateTeamMembership } = await import('./teamValidationService');
    return await validateTeamMembership(userId, teamId);
  } catch (error) {
    console.error("Error checking team membership:", error);
    return false;
  }
}

// Add function to get all equipment assigned to a team
export async function getTeamEquipment(teamId: string) {
  try {
    if (!teamId) return [];
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('team_id', teamId)
      .is('deleted_at', null);
      
    if (error) {
      console.error("Error fetching team equipment:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getTeamEquipment:", error);
    throw error;
  }
}
