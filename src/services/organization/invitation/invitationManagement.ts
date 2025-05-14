
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { generateToken } from './tokenService';
import { sendInvitationEmail } from './emailService';
import { OrganizationInvitation } from './types';

/**
 * Get pending invitations for an organization
 */
export async function getPendingOrganizationInvitations(orgId: string): Promise<OrganizationInvitation[]> {
  try {
    if (!orgId) {
      console.error('Organization ID is required');
      return [];
    }
    
    const { data, error } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'sent');
      
    if (error) {
      console.error('Error fetching pending invitations:', error);
      return [];
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Error in getPendingOrganizationInvitations:', error);
    return [];
  }
}

/**
 * Resend an invitation
 */
export async function resendOrganizationInvite(invitationId: string): Promise<{ 
  success: boolean; 
  error?: string;
}> {
  try {
    // Get the invitation details
    const { data: invitation, error: getError } = await supabase
      .from('organization_invitations')
      .select('*, organization:org_id(name)')
      .eq('id', invitationId)
      .single();
      
    if (getError || !invitation) {
      console.error('Error getting invitation:', getError);
      return { success: false, error: 'Failed to find the invitation.' };
    }
    
    // Generate a new token
    const newToken = await generateToken();
    
    // Update the invitation
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({ 
        token: newToken,
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'sent'
      })
      .eq('id', invitationId);
      
    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return { success: false, error: `Failed to update invitation: ${updateError.message}` };
    }

    // Get current user's email for the from field
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserEmail = sessionData?.session?.user?.email || invitation.invited_by_email;
    
    // Send the invitation email with the new token
    await sendInvitationEmail({
      recipientEmail: invitation.email,
      organizationName: invitation.organization.name,
      inviterEmail: currentUserEmail || "",
      token: newToken,
      role: invitation.role
    });
    
    toast.success("Invitation Resent", {
      description: `The invitation to ${invitation.email} has been resent.`,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in resendOrganizationInvite:', error);
    return { success: false, error: `Resend invitation failed: ${error.message}` };
  }
}

/**
 * Cancel an invitation
 */
export async function cancelOrganizationInvite(invitationId: string): Promise<{ 
  success: boolean; 
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('organization_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);
      
    if (error) {
      console.error('Error cancelling invitation:', error);
      return { success: false, error: `Failed to cancel invitation: ${error.message}` };
    }
    
    toast.success("Invitation Cancelled", {
      description: "The invitation has been cancelled successfully.",
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in cancelOrganizationInvite:', error);
    return { success: false, error: `Failed to cancel invitation: ${error.message}` };
  }
}
