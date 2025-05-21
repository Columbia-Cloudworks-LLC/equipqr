
import { supabase } from "@/integrations/supabase/client";
import { retry } from "@/utils/edgeFunctions/retry";

/**
 * Fetches pending invitations for a specific team
 */
export async function getPendingInvitations(teamId: string) {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(name)')
      .eq('team_id', teamId)
      .eq('status', 'pending');
      
    if (error) {
      console.error('Error fetching pending invitations:', error);
      throw new Error(`Failed to fetch invitations: ${error.message}`);
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Error in getPendingInvitations:', error);
    return [];
  }
}

/**
 * Fetches pending invitations for the current user's email
 * This works across organizations
 */
export async function getPendingInvitationsForUser() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Error retrieving session:", sessionError);
      return [];
    }
    
    if (!sessionData?.session?.user?.email) {
      console.error("No authenticated user email found");
      return [];
    }
    
    const userEmail = sessionData.session.user.email.toLowerCase();
    
    // Query invitations directly with an email filter to avoid RLS errors
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(name)')
      .eq('email', userEmail)
      .eq('status', 'pending');
    
    if (error) {
      console.error('Error fetching pending invitations:', error);
      throw new Error(`Failed to fetch invitations: ${error.message}`);
    }
    
    console.log(`Found ${data?.length || 0} pending invitations for ${userEmail}`);
    return data || [];
  } catch (error: any) {
    console.error('Error in getPendingInvitationsForUser:', error);
    return [];
  }
}

/**
 * Get active invitations for current user (not dismissed)
 */
export async function getActiveInvitations() {
  try {
    // Use the same logic as getPendingInvitationsForUser but could be extended
    // to filter by active/dismissed status in the future
    return await getPendingInvitationsForUser();
  } catch (error) {
    console.error("Error fetching active invitations:", error);
    return [];
  }
}
