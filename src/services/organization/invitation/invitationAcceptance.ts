
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateOrganizationInvitation } from './invitationValidation';
import { InvitationResult } from './types';

/**
 * Accept an organization invitation
 */
export async function acceptOrganizationInvitation(token: string): Promise<InvitationResult> {
  try {
    console.log(`Accepting organization invitation with token: ${token.substring(0, 8)}...`);
    
    // First validate the invitation
    const { valid, invitation, error: validationError } = await validateOrganizationInvitation(token);
    
    if (!valid || !invitation) {
      console.error('Invalid invitation:', validationError);
      return { success: false, error: validationError || 'Invalid invitation' };
    }
    
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return { success: false, error: 'You must be logged in to accept an invitation' };
    }
    
    // Call the edge function to accept the invitation
    const { data, error } = await supabase.functions.invoke('accept_organization_invitation', {
      body: { token }
    });
    
    if (error) {
      console.error('Error accepting organization invitation:', error);
      return { success: false, error: error.message || 'Failed to accept invitation' };
    }
    
    if (!data?.success) {
      console.error('Error in accept_organization_invitation:', data?.error);
      return { success: false, error: data?.error || 'Unknown error accepting invitation' };
    }
    
    return {
      success: true,
      data: {
        organization: data.data.organization,
        role: data.data.role
      }
    };
  } catch (error: any) {
    console.error('Error in acceptOrganizationInvitation:', error);
    return { success: false, error: error.message || 'Failed to accept invitation' };
  }
}
