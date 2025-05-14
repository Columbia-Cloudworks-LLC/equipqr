
import { supabase } from '@/integrations/supabase/client';
import { EmailInvitationOptions } from './types';

/**
 * Send an invitation email to a user
 */
export async function sendInvitationEmail(options: EmailInvitationOptions): Promise<void> {
  try {
    const { recipientEmail, organizationName, inviterEmail, token, role } = options;
    
    const { error } = await supabase.functions.invoke('send_organization_invitation_email', {
      body: {
        email: recipientEmail,
        organization_name: organizationName,
        inviter_email: inviterEmail,
        token,
        role
      }
    });
    
    if (error) {
      console.error('Error sending invitation email:', error);
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Error in sendInvitationEmail:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}
