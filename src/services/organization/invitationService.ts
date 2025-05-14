
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserRole } from '@/types/supabase-enums';

/**
 * Generate a unique token for invitation
 */
async function generateToken(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('gen_invitation_token');
    
    if (error) {
      console.error('Error generating invitation token:', error);
      throw new Error('Failed to generate invitation token');
    }
    
    return data;
  } catch (error) {
    console.error('Error in generateToken:', error);
    throw error;
  }
}

/**
 * Send an invitation email to a user
 */
async function sendInvitationEmail(options: {
  recipientEmail: string;
  organizationName: string;
  inviterEmail: string;
  token: string;
  role: string;
}): Promise<void> {
  try {
    const { recipientEmail, organizationName, inviterEmail, token, role } = options;
    
    const { error } = await supabase.functions.invoke('send_organization_invitation_email', {
      body: {
        email: recipientEmail,
        organization_name: organizationName,
        inviter_email: inviterEmail,
        token,
        role
      }
    });
    
    if (error) {
      console.error('Error sending invitation email:', error);
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Error in sendInvitationEmail:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

/**
 * Invite a user to an organization
 */
export async function inviteToOrganization(
  email: string,
  role: UserRole,
  orgId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!email || !orgId) {
      return { success: false, error: 'Email and organization ID are required' };
    }
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return { success: false, error: 'You must be logged in to invite users' };
    }
    
    // Check if the user has permission to invite others to the organization
    const { data: hasPermission } = await supabase.rpc('can_manage_org_members', {
      p_user_id: sessionData.session.user.id,
      p_org_id: orgId
    });
    
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to invite users to this organization' };
    }
    
    // Check if user already exists in auth system
    const { data: existingUser } = await supabase.rpc('get_user_by_email_safe', {
      email_param: normalizedEmail
    });
    
    // Check if user is already a member of the organization
    let isAlreadyMember = false;
    
    if (existingUser && existingUser.length > 0) {
      const user = existingUser[0];
      
      // Check if already a member by querying user_roles
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', user.id);
        
      if (memberCheckError) {
        console.error('Error checking organization membership:', memberCheckError);
      }
      
      isAlreadyMember = existingMember && existingMember.length > 0;
      
      if (isAlreadyMember) {
        return {
          success: false,
          error: 'This user is already a member of the organization'
        };
      }
    }
    
    // Check if there's a pending invitation
    const { data: pendingInvites } = await supabase
      .from('organization_invitations')
      .select('id, status, email')
      .eq('org_id', orgId)
      .eq('email', normalizedEmail)
      .or('status.eq.pending,status.eq.sent');
      
    if (pendingInvites && pendingInvites.length > 0) {
      return {
        success: false,
        error: 'There is already a pending invitation for this email'
      };
    }
    
    // Get the organization name for the email
    const { data: org } = await supabase
      .from('organization')
      .select('name')
      .eq('id', orgId)
      .single();
      
    if (!org) {
      return { success: false, error: 'Organization not found' };
    }
    
    // Generate a unique token for invitation
    const token = await generateToken();
    
    // Get inviter's email for context
    const inviterEmail = sessionData.session.user.email;
    
    // Create an invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('organization_invitations')
      .insert({
        org_id: orgId,
        email: normalizedEmail,
        role: role,
        token: token,
        created_by: sessionData.session.user.id,
        status: 'pending',
        invited_by_email: inviterEmail
      })
      .select()
      .single();
    
    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return { success: false, error: `Failed to create invitation: ${inviteError.message}` };
    }
    
    // Send invitation email
    try {
      await sendInvitationEmail({
        recipientEmail: normalizedEmail,
        organizationName: org.name,
        inviterEmail: inviterEmail || "",
        token,
        role: role
      });
      
      // Update invitation status to 'sent'
      await supabase
        .from('organization_invitations')
        .update({ status: 'sent' })
        .eq('id', invitation.id);
        
      return {
        success: true,
        data: {
          invitation,
          directly_added: false
        }
      };
    } catch (emailError: any) {
      console.error('Error sending invitation email:', emailError);
      // Still return success but with a warning
      return {
        success: true,
        data: {
          invitation,
          directly_added: false
        },
        error: 'Invitation created but email notification failed'
      };
    }
  } catch (error: any) {
    console.error('Error in inviteToOrganization:', error);
    return {
      success: false,
      error: error.message || 'Failed to invite user to organization'
    };
  }
}

/**
 * Validate an organization invitation token
 */
export async function validateOrganizationInvitation(token: string): Promise<{ 
  valid: boolean; 
  invitation?: any; 
  error?: string;
}> {
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

/**
 * Accept an organization invitation
 */
export async function acceptOrganizationInvitation(token: string): Promise<{ 
  success: boolean; 
  data?: any; 
  error?: string;
}> {
  try {
    // First validate the invitation
    const { valid, invitation, error: validationError } = await validateOrganizationInvitation(token);
    
    if (!valid || !invitation) {
      return { success: false, error: validationError || 'Invalid invitation' };
    }
    
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return { success: false, error: 'You must be logged in to accept an invitation' };
    }
    
    // Check if the email matches
    if (sessionData.session.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return { 
        success: false, 
        error: `This invitation was sent to ${invitation.email}. Please log in with that email to accept.` 
      };
    }
    
    // Check if the user is already a member
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('org_id', invitation.org_id)
      .eq('user_id', sessionData.session.user.id)
      .maybeSingle();
      
    if (existingRole) {
      return { 
        success: false, 
        error: 'You are already a member of this organization' 
      };
    }
    
    // Add the user to the organization with the specified role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: sessionData.session.user.id,
        org_id: invitation.org_id,
        role: invitation.role,
        assigned_by: invitation.created_by
      });
      
    if (roleError) {
      console.error('Error assigning role:', roleError);
      return { success: false, error: `Failed to assign role: ${roleError.message}` };
    }
    
    // Update user_profiles to include the organization if not already set
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', sessionData.session.user.id)
      .single();
    
    if (profile && !profile.org_id) {
      await supabase
        .from('user_profiles')
        .update({ org_id: invitation.org_id })
        .eq('id', sessionData.session.user.id);
    }
    
    // Mark the invitation as accepted
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({ 
        status: 'accepted', 
        accepted_at: new Date().toISOString() 
      })
      .eq('id', invitation.id);
      
    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      // Not critical, as the user is already added to the organization
    }
    
    toast({
      title: "Welcome!",
      description: `You have successfully joined ${invitation.organization.name}`,
    });
    
    return { 
      success: true, 
      data: { 
        organization: invitation.organization,
        role: invitation.role
      }
    };
  } catch (error: any) {
    console.error('Error in acceptOrganizationInvitation:', error);
    return { success: false, error: error.message || 'Failed to accept invitation' };
  }
}

/**
 * Get pending invitations for an organization
 */
export async function getPendingOrganizationInvitations(orgId: string): Promise<any[]> {
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
    
    toast({
      title: "Invitation Resent",
      description: `The invitation to ${invitation.email} has been resent.`,
      variant: "success"
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
    
    toast({
      title: "Invitation Cancelled",
      description: "The invitation has been cancelled successfully.",
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in cancelOrganizationInvite:', error);
    return { success: false, error: `Failed to cancel invitation: ${error.message}` };
  }
}

export type OrganizationInvitation = {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  created_at: string;
  updated_at: string;
  organization: {
    name: string;
  };
};
