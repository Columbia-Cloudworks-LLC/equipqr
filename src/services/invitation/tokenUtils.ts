
/**
 * Clean and validate the invitation token format
 * @param token Raw token from URL
 * @returns Sanitized token or null if invalid
 */
export function sanitizeToken(token: string | undefined): string | null {
  if (!token) return null;
  
  // Remove any whitespace and unwanted characters
  const sanitized = token.trim().replace(/[^\w-]/g, '');
  
  // Basic validation - must be at least 16 chars and alphanumeric+dash
  if (sanitized.length < 16 || !/^[\w-]+$/.test(sanitized)) {
    console.warn('Invalid token format:', sanitized.substring(0, 8) + '...');
    return null;
  }
  
  return sanitized;
}

/**
 * Detect whether a token is for a team or organization invitation
 * based on probing both endpoints
 * @param token The invitation token
 * @returns 'team' | 'organization' or null if can't be determined
 */
export async function detectInvitationType(token: string): Promise<'team' | 'organization' | null> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Try organization invitation first (more reliable edge function)
    try {
      console.log(`Attempting to detect if token ${token.substring(0, 8)}... is an organization invitation`);
      const { data, error } = await supabase.functions.invoke('validate_org_invitation', {
        body: { token, checkOnly: true }
      });
      
      if (!error && data?.valid) {
        console.log('Token detected as organization invitation');
        return 'organization';
      }
    } catch (err) {
      console.log('Organization detection failed, will try team next');
    }
    
    // Try team invitation detection
    try {
      console.log(`Attempting to detect if token ${token.substring(0, 8)}... is a team invitation`);
      const { data, error } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('token', token)
        .maybeSingle();
        
      if (!error && data) {
        console.log('Token detected as team invitation');
        return 'team';
      }
    } catch (err) {
      console.log('Team detection failed');
    }
    
    console.warn('Could not reliably detect invitation type');
    return null;
  } catch (error) {
    console.error('Error in detectInvitationType:', error);
    return null;
  }
}

/**
 * Validate that the current session can be used for invitation operations
 */
export async function validateSessionForInvitation(): Promise<boolean> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    console.log('Validating session for invitation operations');
    
    // Get current session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return false;
    }
    
    if (!data?.session) {
      console.warn('No session found');
      return false;
    }
    
    // Check token validity by making a simple profile request
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', data.session.user.id)
        .single();
      
      if (profileError) {
        console.warn('Profile request failed with existing token:', profileError);
        
        // Try refreshing the token
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return false;
        }
        
        return true;
      }
      
      return true;
    } catch (err) {
      console.error('Error validating session:', err);
      return false;
    }
  } catch (err) {
    console.error('Unexpected error in validateSessionForInvitation:', err);
    return false;
  }
}
