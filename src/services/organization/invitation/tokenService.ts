
import { supabase } from '@/integrations/supabase/client';
import { generateInvitationToken } from '@/lib/crypto';

/**
 * Generate a unique token for invitation
 */
export async function generateToken(): Promise<string> {
  try {
    // Try to use the database function first
    const { data, error } = await supabase.rpc('gen_invitation_token');
    
    if (error) {
      console.error('Error generating invitation token from database:', error);
      // Fall back to our client-side token generation
      return generateInvitationToken();
    }
    
    return data;
  } catch (error) {
    console.error('Error in generateToken:', error);
    // Fall back to our client-side token generation
    return generateInvitationToken();
  }
}
