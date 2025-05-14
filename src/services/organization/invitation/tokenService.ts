
import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a unique token for invitation
 */
export async function generateToken(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('gen_invitation_token');
    
    if (error) {
      console.error('Error generating invitation token:', error);
      throw new Error('Failed to generate invitation token');
    }
    
    return data;
  } catch (error) {
    console.error('Error in generateToken:', error);
    throw error;
  }
}
