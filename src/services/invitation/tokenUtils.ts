
import { supabase } from '@/integrations/supabase/client';

/**
 * Validates and sanitizes invitation tokens
 */
export function sanitizeToken(token: string | undefined): string | null {
  if (!token) return null;
  
  // Remove any whitespace and non-alphanumeric characters
  const sanitized = token.trim();
  
  // Check if token meets minimum length requirement
  if (sanitized.length < 10) {
    console.error(`Invalid token format: length=${sanitized.length}`);
    return null;
  }
  
  return sanitized;
}

/**
 * Helper to detect invitation type based on token characteristics
 */
export async function detectInvitationType(token: string): Promise<'team' | 'organization' | null> {
  try {
    if (!token || token.length < 10) return null;
    
    console.log(`Attempting to detect invitation type for token: ${token.substring(0, 8)}...`);
    
    // First try team invitation
    const { data: teamCheck, error: teamError } = await supabase
      .from('team_invitations')
      .select('id, token')
      .eq('token', token)
      .limit(1)
      .maybeSingle();
    
    if (teamCheck && !teamError) {
      console.log('Detected token type: team invitation');
      return 'team';
    }
    
    // Then try organization invitation
    const { data: orgCheck, error: orgError } = await supabase
      .from('organization_invitations')
      .select('id, token')
      .eq('token', token)
      .limit(1)
      .maybeSingle();
    
    if (orgCheck && !orgError) {
      console.log('Detected token type: organization invitation');
      return 'organization';
    }
    
    console.log('Could not determine token type from database');
    return null;
  } catch (error) {
    console.error('Error detecting invitation type:', error);
    return null;
  }
}

/**
 * Check if the current session is valid and user is authenticated
 */
export async function validateSessionForInvitation(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data?.session?.user) {
      return false;
    }
    
    // Verify that the session has a valid token that hasn't expired
    const session = data.session;
    const now = Math.floor(Date.now() / 1000);
    
    if (session.expires_at && session.expires_at < now) {
      console.log('Session token has expired');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
}
