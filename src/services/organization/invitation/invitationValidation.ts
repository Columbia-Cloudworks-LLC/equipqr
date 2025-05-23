
import { supabase } from '@/integrations/supabase/client';
import { ValidationResult } from './types';
import { sanitizeToken } from '@/services/invitation/tokenUtils';

/**
 * Validate an organization invitation token
 */
export async function validateOrganizationInvitation(token: string): Promise<ValidationResult & { rateLimit?: boolean }> {
  try {
    // Sanitize and validate token format
    const sanitizedToken = sanitizeToken(token);
    if (!sanitizedToken) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    console.log(`Validating organization invitation token: ${sanitizedToken.substring(0, 8)}...`);
    
    // Try using the edge function for validation (most reliable)
    try {
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate_org_invitation', {
        body: { token: sanitizedToken }
      });
      
      if (validationError) {
        console.warn('Edge function validation failed, falling back to direct query:', validationError);
        
        // Check for rate limit
        if (validationError.message?.includes('429') || validationError.status === 429) {
          return { 
            valid: false, 
            error: 'Too many requests. Please try again in a moment.', 
            rateLimit: true 
          };
        }
      } else if (validationData) {
        console.log('Organization invitation validation via edge function:', validationData.valid);
        return { ...validationData, rateLimit: false };
      }
    } catch (edgeFunctionError: any) {
      console.warn('Error calling validation edge function:', edgeFunctionError);
      
      // Check for rate limit
      if (edgeFunctionError.message?.includes('429') || edgeFunctionError.status === 429) {
        return { 
          valid: false, 
          error: 'Too many requests. Please try again in a moment.', 
          rateLimit: true 
        };
      }
      // Continue to fallback method
    }
    
    // Fallback: direct query if edge function fails
    // IMPORTANT: Using proper table aliasing in the query with explicit aliases
    const { data, error } = await supabase
      .from('organization_invitations')
      .select('*, organization:org_id(name)')
      .eq('token', sanitizedToken)
      .or('organization_invitations.status.eq.sent,organization_invitations.status.eq.pending')
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
    
    // Check for rate limit
    if (error.message?.includes('429') || error.status === 429) {
      return { 
        valid: false, 
        error: 'Too many requests. Please try again in a moment.', 
        rateLimit: true 
      };
    }
    
    return { valid: false, error: error.message || 'Failed to validate invitation' };
  }
}
