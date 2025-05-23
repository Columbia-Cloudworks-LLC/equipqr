
import { supabase } from '@/integrations/supabase/client';
import { sendInvitationEmail, generateToken } from './invitationHelpers';
import { UserRole } from '@/types/supabase-enums';

/**
 * Invite a user to join a team
 * @param email The email address of the user to invite
 * @param role The role to assign to the user
 * @param teamId The ID of the team to invite to
 * @returns Data about the created invitation
 */
export async function inviteMember(
  email: string,
  role: UserRole,
  teamId: string
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    console.log(`Inviting ${email} to team ${teamId} with role ${role}`);
    
    if (!email || !teamId) {
      throw new Error('Email and team ID are required');
    }
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to invite team members');
    }
    
    // Check if the user has manager permissions for the team
    const { data: permissionData } = await supabase.functions.invoke('check_team_role_permission', {
      body: { 
        team_id: teamId, 
        user_id: sessionData.session.user.id 
      }
    });
    
    if (!permissionData?.hasPermission) {
      throw new Error('You do not have permission to invite users to this team');
    }
    
    // Check if user is already a member of the team
    const { data: existingUser } = await supabase.rpc('get_user_by_email', {
      email_address: normalizedEmail
    });
    
    let isAlreadyMember = false;
    
    if (existingUser && existingUser[0]) {
      // Fix: Access the first element of the array to get the user object
      const user = existingUser[0];
      
      // Check if already a member by querying team_member directly
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('team_member')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', user.id);
        
      if (memberCheckError) {
        console.error('Error checking team membership:', memberCheckError);
      }
      
      isAlreadyMember = existingMember && existingMember.length > 0;
      
      if (isAlreadyMember) {
        return {
          success: false,
          error: 'This user is already a member of the team'
        };
      }
    }
    
    // Check if there's a pending invitation
    const { data: pendingInvites } = await supabase
      .from('team_invitations')
      .select('id, status, email')
      .eq('team_id', teamId)
      .eq('email', normalizedEmail)
      .or('status.eq.pending,status.eq.sent');
      
    if (pendingInvites && pendingInvites.length > 0) {
      return {
        success: false,
        error: 'There is already a pending invitation for this email'
      };
    }
    
    // Generate a unique token for invitation
    const token = await generateToken();
    
    // Get inviter's email for context
    const inviterEmail = sessionData.session.user.email;
    
    // Create an invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
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
      throw new Error(`Failed to create invitation: ${inviteError.message}`);
    }
    
    // Send invitation email
    try {
      // Fix: Looking at the function signature in invitationHelpers.ts, we need to pass an object with required properties
      await sendInvitationEmail({
        recipientEmail: normalizedEmail,
        teamName: "Team", // We should get the team name here, but for now just use generic name
        inviterEmail: inviterEmail || "",
        token,
        action: "invite",
        role: role
      });
      
      // Update invitation status to 'sent'
      await supabase
        .from('team_invitations')
        .update({ status: 'sent' })
        .eq('id', invitation.id);
        
      return {
        success: true,
        data: {
          invitation,
          directly_added: false
        }
      };
    } catch (emailError) {
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
    console.error('Error in inviteMember:', error);
    return {
      success: false,
      error: error.message || 'Failed to invite team member'
    };
  }
}
