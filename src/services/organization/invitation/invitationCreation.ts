import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';
import { toast } from '@/hooks/use-toast';
import { generateToken } from './tokenService';
import { sendInvitationEmail } from './emailService';
import { InvitationResult } from './types';

/**
 * Invite a user to an organization
 */
export async function inviteToOrganization(
  email: string,
  role: UserRole,
  orgId: string
): Promise<InvitationResult> {
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
    
    // Create an invitation record with status 'pending' to match our retrieval query
    const { data: invitation, error: inviteError } = await supabase
      .from('organization_invitations')
      .insert({
        org_id: orgId,
        email: normalizedEmail,
        role: role,
        token: token,
        created_by: sessionData.session.user.id,
        status: 'pending', // Keep this as 'pending' - we're now querying for 'pending' status
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
      
      // We no longer need to update the invitation status to 'sent' - keep it as 'pending'
      // as that's what our query is now looking for
      
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
