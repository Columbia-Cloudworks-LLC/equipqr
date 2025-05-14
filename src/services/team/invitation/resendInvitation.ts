
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Resend a team invitation email to a user
 * @param invitationId - The ID of the invitation to resend
 * @returns Promise resolving to true if successful
 */
export async function resendTeamInvitation(invitationId: string): Promise<boolean> {
  try {
    // Get the current user's session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to resend invitations');
    }
    
    // Use the edge function to resend the invitation
    const { data: result, error } = await supabase.functions.invoke('resend_team_invitation', {
      body: {
        invitation_id: invitationId,
        requester_id: sessionData.session.user.id
      }
    });
    
    if (error) {
      console.error('Error resending invitation:', error);
      throw new Error(`Failed to resend invitation: ${error.message}`);
    }
    
    if (!result?.success) {
      const reason = result?.reason || 'unknown error';
      throw new Error(`Failed to resend invitation: ${reason}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Error in resendTeamInvitation:', error);
    toast.error('Could not resend invitation', {
      description: error.message || 'Please try again later'
    });
    throw error;
  }
}
