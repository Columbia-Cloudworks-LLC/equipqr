
import { supabase } from "@/integrations/supabase/client";
import { validateInvitationToken } from "./invitation/validateInvitation";
import { acceptInvitation } from "./invitation/acceptInvitation";
import { sendInvitationEmail, generateToken } from "./invitation/invitationHelpers";
import { getPendingInvitationsForUser } from "./notificationService";
import { 
  resendInvite, 
  cancelInvitation, 
  getPendingInvitations 
} from "./invitation/invitationActions";

/**
 * Export all functions to maintain compatibility with existing code
 */
export {
  validateInvitationToken,
  acceptInvitation,
  sendInvitationEmail,
  generateToken,
  getPendingInvitationsForUser,
  resendInvite,
  cancelInvitation,
  getPendingInvitations
};

/**
 * Get pending invitations for the current user's email
 */
export async function getPendingTeamInvitations() {
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
    console.error('Error in getPendingTeamInvitations:', error);
    return [];
  }
}
