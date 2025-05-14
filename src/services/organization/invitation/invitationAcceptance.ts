
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { validateOrganizationInvitation } from './invitationValidation';
import { InvitationResult } from './types';

/**
 * Accept an organization invitation
 */
export async function acceptOrganizationInvitation(token: string): Promise<InvitationResult> {
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
    
    toast.success("Welcome!", {
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
