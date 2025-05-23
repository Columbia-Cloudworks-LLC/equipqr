
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
    
    console.log(`Validating organization invitation token: ${token.substring(0, 8)}...`);
    
    try {
      // First try using the edge function for validation (most reliable)
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate_org_invitation', {
        body: { token }
      });
      
      if (validationError) {
        console.warn('Edge function validation failed, falling back to direct query:', validationError);
      } else if (validationData) {
        console.log('Organization invitation validation via edge function:', validationData.valid);
        return validationData;
      }
    } catch (edgeFunctionError) {
      console.warn('Error calling validation edge function:', edgeFunctionError);
      // Continue to fallback method
    }
    
    // Fallback: direct query if edge function fails
    // Get the invitation by token - check both 'sent' and 'pending' statuses for compatibility
    const { data, error } = await supabase
      .from('organization_invitations')
      .select('*, organization:org_id(name)')
      .eq('token', token)
      .or('status.eq.sent,status.eq.pending')
      .single();
      
    if (error || !data) {
      console.error('Error validating invitation:', error);
      return { valid: false, error: 'Invalid or expired invitation' };
    }
    
    // Check if the invitation has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'This invitation has expired' };
    }
    
    console.log('Organization invitation is valid:', data.id);
    return { valid: true, invitation: data };
  } catch (error: any) {
    console.error('Error in validateOrganizationInvitation:', error);
    return { valid: false, error: error.message || 'Failed to validate invitation' };
  }
}
