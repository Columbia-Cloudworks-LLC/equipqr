
import { supabase } from "@/integrations/supabase/client";

// Function to get pending invitations for the current user
export async function getPendingInvitationsForUser() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Error retrieving session when checking for invitations:", sessionError);
      return [];
    }
    
    if (!sessionData?.session?.user?.email) {
      console.log("No authenticated user email found when checking for invitations");
      return [];
    }

    const userEmail = sessionData.session.user.email.toLowerCase();
    console.log(`Getting invitations for email: ${userEmail}`);
    
    // Use a direct call to an edge function to avoid RLS recursion issues
    const { data, error } = await supabase.functions.invoke('get_user_invitations', {
      body: {
        email: userEmail
      }
    });
      
    if (error) {
      console.error('Error fetching pending invitations for user:', error);
      throw error;
    }
    
    console.log(`Found ${data?.invitations?.length || 0} pending invitations for ${userEmail}`);
    
    return data?.invitations || [];
  } catch (error: any) {
    console.error('Error in getPendingInvitationsForUser:', error);
    throw new Error(`Failed to get pending invitations: ${error.message}`);
  }
}

// Function to get active notifications with minimal retry logic
export async function getActiveInvitations(retryCount = 0, maxRetries = 1) {
  try {
    // Check if we have an active session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      console.log("No active session, skipping invitation check");
      return [];
    }
    
    console.log(`Getting active invitations for ${sessionData.session.user.email}`);
    const invitations = await getPendingInvitationsForUser();
    
    // Only retry once if no invitations found initially
    if (invitations.length === 0 && retryCount < maxRetries) {
      console.log(`No invitations found on attempt ${retryCount + 1}, will retry in 1s`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getActiveInvitations(retryCount + 1, maxRetries);
    }
    
    return invitations;
  } catch (error) {
    console.error("Error in getActiveInvitations:", error);
    
    // Implement minimal retry logic
    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getActiveInvitations(retryCount + 1, maxRetries);
    }
    
    return [];
  }
}
