
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Generate a random token for team invitations
 */
export async function generateToken() {
  try {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Error generating token:', error);
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Send invitation email using edge function
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
  action: 'invite' | 'resend';
  role: string;
}) {
  try {
    console.log(`Sending ${action} invitation email to ${recipientEmail} for team ${teamName}`);
    
    const { data, error } = await supabase.functions.invoke('send_invitation_email', {
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
      throw new Error(`Failed to send invitation: ${error.message}`);
    }
    
    console.log('Email sent successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Error in sendInvitationEmail:', error);
    toast.error('Failed to send invitation email', {
      description: error.message || 'Please try again or contact support'
    });
    return null;
  }
}
