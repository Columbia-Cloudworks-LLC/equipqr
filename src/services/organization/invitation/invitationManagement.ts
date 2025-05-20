
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
    
    console.log(`Fetching pending invitations for org ID: ${orgId}`);
    
    const { data: invitationsData, error } = await supabase
      .from('organization_invitations')
      .select('*, organization:org_id(name)')
      .eq('org_id', orgId)
      .eq('status', 'pending');  // Changed from 'sent' to 'pending' to match actual database state
      
    if (error) {
      console.error('Error fetching pending invitations:', error);
      return [];
    }
    
    console.log(`Found ${invitationsData?.length || 0} pending invitations`);
    
    // Transform data to match OrganizationInvitation type, ensuring role is cast correctly
    const invitations: OrganizationInvitation[] = invitationsData.map(item => ({
      id: item.id,
      email: item.email,
      role: item.role as OrganizationInvitation['role'],
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      org_id: item.org_id,
      organization: item.organization
    }));
    
    return invitations;
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
        status: 'pending' // Keep status as 'pending' to match our retrieval query
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
