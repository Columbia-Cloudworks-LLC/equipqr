
import { supabase } from "@/integrations/supabase/client";

// Function to get pending invitations for the current user
export async function getPendingInvitationsForUser() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Error retrieving session when checking for invitations:", sessionError);
      return [];
    }
    
    if (!sessionData?.session?.user) {
      console.warn("No authenticated user found when checking for invitations");
      return [];
    }

    const userEmail = sessionData.session.user.email?.toLowerCase();
    
    if (!userEmail) {
      console.warn("User email not found in session");
      return [];
    }
    
    console.log(`Checking for invitations for email: ${userEmail}`);
    
    // First, let's check if there are any invitations regardless of status (for debugging)
    const { data: allInvitations, error: allError } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(name)')
      .ilike('email', userEmail);
      
    console.log(`DEBUG: Found ${allInvitations?.length || 0} total invitations (any status) for ${userEmail}`);
    if (allInvitations?.length) {
      allInvitations.forEach(inv => {
        console.log(`DEBUG: Invitation ${inv.id} status: ${inv.status}, email: ${inv.email}`);
      });
    }
    
    // Get only pending invitations
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(name)')
      .ilike('email', userEmail)  // Using ilike instead of eq for case-insensitive matching
      .eq('status', 'pending');
      
    if (error) {
      console.error('Error fetching pending invitations for user:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} pending invitations for ${userEmail}`);
    if (data?.length) {
      data.forEach(inv => {
        console.log(`Invitation detail - ID: ${inv.id}, Team: ${inv.team?.name || 'Unknown'}, Role: ${inv.role}`);
      });
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Error in getPendingInvitationsForUser:', error);
    throw new Error(`Failed to get pending invitations: ${error.message}`);
  }
}

// Function to get active notifications with retry logic
export async function getActiveInvitations(retryCount = 0, maxRetries = 2) {
  try {
    console.log(`Attempting to get active invitations (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Check if we have an active session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      console.log("No active session, skipping invitation check");
      return [];
    }

    // Add a small delay to ensure the session is fully established
    if (retryCount === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const invitations = await getPendingInvitationsForUser();
    
    if (invitations.length === 0 && retryCount < maxRetries) {
      // If no invitations found on first attempt, try again after a delay
      console.log(`No invitations found on attempt ${retryCount + 1}, will retry in ${(retryCount + 1) * 1000}ms`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
      return getActiveInvitations(retryCount + 1, maxRetries);
    }
    
    console.log(`Retrieved ${invitations.length} active invitations`);
    return invitations;
  } catch (error) {
    console.error("Error in getActiveInvitations:", error);
    
    // Implement retry logic
    if (retryCount < maxRetries) {
      console.log(`Retrying invitation fetch (${retryCount + 1}/${maxRetries})`);
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return getActiveInvitations(retryCount + 1, maxRetries);
    }
    
    // Return empty array after max retries
    console.log("Max retries reached, returning empty invitations array");
    return [];
  }
}
