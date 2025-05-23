
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';
import { toast } from 'sonner';
import { sanitizeToken } from '@/services/invitation/tokenUtils';
import { AcceptanceResult } from '@/types/invitations';

/**
 * Handles accepting an organization invitation
 */
export async function acceptOrganizationInvitation(token: string): Promise<AcceptanceResult> {
  try {
    // Sanitize the token
    const sanitizedToken = sanitizeToken(token);
    if (!sanitizedToken) {
      throw new Error('Invalid invitation token format');
    }
    
    console.log(`Starting invitation acceptance for token: ${sanitizedToken.substring(0, 8)}...`);
    
    // Use the edge function instead of direct database operations
    // This function has proper SQL queries with aliasing
    const { data: acceptResult, error: acceptError } = await supabase.functions.invoke(
      'accept_organization_invitation', {
        body: { token: sanitizedToken }
      }
    );
    
    if (acceptError) {
      console.error('Error accepting organization invitation:', acceptError);
      throw new Error(acceptError.message || 'Failed to accept invitation');
    }
    
    if (!acceptResult.success) {
      console.error('Failed to accept invitation:', acceptResult.error);
      throw new Error(acceptResult.error || 'Failed to accept invitation');
    }
    
    console.log('Invitation accepted successfully:', acceptResult);
    
    // Return the result in expected format
    return {
      success: true,
      organizationId: acceptResult.data?.organization?.id,
      organizationName: acceptResult.data?.organization?.name,
      teamId: undefined,
      teamName: undefined,
      role: acceptResult.data?.role as any
    };
  } catch (error: any) {
    console.error('Error accepting organization invitation:', error);
    return {
      success: false,
      error: error.message || 'Failed to accept invitation'
    };
  }
}
