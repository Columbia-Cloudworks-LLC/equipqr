
import { supabase } from '@/integrations/supabase/client';
import { ValidationResult } from './types';

/**
 * Validate an organization invitation token
 */
export async function validateOrganizationInvitation(token: string): Promise<ValidationResult> {
  try {
    if (!token) {
      return { valid: false, error: 'Invalid token' };
    }
    
    // Get the invitation by token
    const { data, error } = await supabase
      .from('organization_invitations')
      .select('*, organization:org_id(name)')
      .eq('token', token)
      .eq('status', 'sent')
      .single();
      
    if (error || !data) {
      console.error('Error validating invitation:', error);
      return { valid: false, error: 'Invalid or expired invitation' };
    }
    
    // Check if the invitation has expired
    if (new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'This invitation has expired' };
    }
    
    return { valid: true, invitation: data };
  } catch (error: any) {
    console.error('Error in validateOrganizationInvitation:', error);
    return { valid: false, error: error.message || 'Failed to validate invitation' };
  }
}
