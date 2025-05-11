
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Helper function to send invitation emails
 */
export async function sendInvitationEmail({
  recipientEmail,
  teamName,
  inviterEmail,
  inviterName,
  token,
  action,
  role
}: {
  recipientEmail: string;
  teamName: string;
  inviterEmail: string;
  inviterName?: string;
  token: string;
  action: "invite" | "resend";
  role: string;
}) {
  try {
    // Skip sending emails for direct adds (existing users added directly to team)
    if (token === "direct-add") {
      console.log("User added directly to team, skipping invitation email");
      return true;
    }
    
    console.log(`Sending ${action} email to ${recipientEmail} for team ${teamName}`);
    
    const { error } = await supabase.functions.invoke('send_invitation_email', {
      body: {
        recipientEmail,
        teamName,
        inviterEmail,
        inviterName,
        token,
        action,
        role
      }
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      toast.error("Invitation created, but email could not be sent. User can still accept via invitation link.");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in sendInvitationEmail:', error);
    toast.error("Invitation created, but email could not be sent. User can still accept via invitation link.");
    return false;
  }
}

/**
 * Helper function to generate a token for invitations
 */
export async function generateToken() {
  try {
    // Call the gen_invitation_token function
    const { data, error } = await supabase.rpc('gen_invitation_token');
    
    if (error) {
      console.error('Error generating token:', error);
      // Fallback to client-side token generation
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    return data;
  } catch (error) {
    console.error('Error in generateToken:', error);
    // Fallback to client-side token generation
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
