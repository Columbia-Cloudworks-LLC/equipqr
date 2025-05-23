
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
    
    // Validate the token using the edge function
    console.log('Validating invitation token...');
    const { data: validationData, error: validationError } = await supabase
      .functions
      .invoke('validate_org_invitation', {
        body: { token: sanitizedToken }
      });
    
    if (validationError) {
      console.error('Validation error:', validationError);
      throw new Error(validationError.message || 'Failed to validate invitation');
    }
    
    console.log('Validation response:', validationData);
    
    if (!validationData?.valid) {
      throw new Error(validationData?.error || 'Invalid or expired invitation');
    }
    
    // Get current user's auth ID
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      throw new Error('Failed to get user session. Please try logging in again.');
    }
    
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('Authentication required. Please login first.');
    }
    
    console.log('User authenticated:', userId);
    
    // Accept the invitation in the database
    console.log('Accepting invitation in database...');
    const { data: acceptData, error: acceptError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('token', sanitizedToken)
      .or('status.eq.pending,status.eq.sent')
      .select('id, org_id, role, organization:org_id(id, name)')
      .single();
    
    if (acceptError) {
      console.error('Error accepting invitation:', acceptError);
      throw new Error(acceptError.message || 'Failed to accept invitation');
    }
    
    if (!acceptData?.org_id) {
      console.error('Invalid invitation data:', acceptData);
      throw new Error('Invalid invitation data');
    }
    
    console.log('Invitation accepted:', acceptData);
    
    // Create a new user role in the organization
    const role = acceptData.role as UserRole;
    
    // Use type assertion to fix the role type issue
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        org_id: acceptData.org_id,
        role: role as any, // Type assertion to bypass the type checking
        assigned_at: new Date().toISOString()
      });
    
    if (roleError) {
      console.error('Error assigning role:', roleError);
      throw new Error(roleError.message || 'Failed to assign role');
    }
    
    console.log('User role created successfully');
    
    return {
      success: true,
      organizationId: acceptData.org_id,
      organizationName: acceptData.organization?.name,
      // Include other properties expected in AcceptanceResult with undefined values
      teamId: undefined,
      teamName: undefined,
      role: role
    };
  } catch (error: any) {
    console.error('Error accepting organization invitation:', error);
    return {
      success: false,
      error: error.message || 'Failed to accept invitation'
    };
  }
}
