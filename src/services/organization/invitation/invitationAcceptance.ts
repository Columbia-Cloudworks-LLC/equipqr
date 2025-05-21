
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';
import { toast } from 'sonner';

export interface InvitationAcceptanceResult {
  success: boolean;
  error?: string;
  organizationId?: string;
  organizationName?: string;
}

/**
 * Handles accepting an organization invitation
 */
export async function acceptOrganizationInvitation(token: string): Promise<InvitationAcceptanceResult> {
  try {
    if (!token) {
      throw new Error('Invalid invitation token');
    }
    
    // Validate the token first
    const { data: validationData, error: validationError } = await supabase
      .functions
      .invoke('validate_org_invitation', {
        body: { token }
      });
    
    if (validationError) {
      console.error('Validation error:', validationError);
      throw new Error(validationError.message || 'Failed to validate invitation');
    }
    
    if (!validationData?.valid) {
      throw new Error(validationData?.error || 'Invalid or expired invitation');
    }
    
    // Get current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error('Authentication required. Please login first.');
    }
    
    // Accept the invitation in the database
    const { data: acceptData, error: acceptError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('token', token)
      .eq('status', 'pending')
      .select('id, org_id, role')
      .single();
    
    if (acceptError) {
      throw new Error(acceptError.message || 'Failed to accept invitation');
    }
    
    if (!acceptData?.org_id) {
      throw new Error('Invalid invitation data');
    }
    
    // Get organization details
    const { data: orgData, error: orgError } = await supabase
      .from('organization')
      .select('name')
      .eq('id', acceptData.org_id)
      .single();
    
    if (orgError) {
      console.error('Error fetching organization:', orgError);
    }
    
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
      throw new Error(roleError.message || 'Failed to assign role');
    }
    
    return {
      success: true,
      organizationId: acceptData.org_id,
      organizationName: orgData?.name
    };
  } catch (error: any) {
    console.error('Error accepting organization invitation:', error);
    return {
      success: false,
      error: error.message || 'Failed to accept invitation'
    };
  }
}
