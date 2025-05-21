
import { supabase } from '@/integrations/supabase/client';
import { retry } from "@/utils/edgeFunctions/retry";

/**
 * Generate a unique token for team invitations
 */
export async function generateToken(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  // Generate a random 32-character token
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}

/**
 * Send invitation email using edge function
 */
export interface SendInvitationEmailParams {
  recipientEmail: string;
  teamName: string;
  inviterEmail: string;
  token: string;
  action: 'invite' | 'resend';
  role: string;
}

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<boolean> {
  try {
    const result = await retry(
      async () => {
        return await supabase.functions.invoke('send_invitation_email', {
          body: {
            recipient: params.recipientEmail,
            team_name: params.teamName,
            inviter: params.inviterEmail,
            token: params.token,
            action: params.action,
            role: params.role
          }
        });
      },
      {
        retries: 2,
        delay: 1000,
      }
    );
    
    if (result.error) {
      console.error('Error sending invitation email:', result.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send invitation email after retries:', error);
    return false;
  }
}

/**
 * Check if an invitation token is valid
 */
export async function validateInvitationToken(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();
      
    if (error) {
      console.error('Error validating invitation token:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in validateInvitationToken:', error);
    return false;
  }
}
