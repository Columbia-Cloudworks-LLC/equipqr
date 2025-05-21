
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';
import { generateToken } from '../invitation/invitationHelpers';

interface InviteMemberResult {
  success: boolean;
  error?: string;
  data?: {
    directly_added?: boolean;
    invitation_id?: string;
  };
}

export async function inviteMember(
  email: string, 
  role: UserRole, 
  teamId: string
): Promise<InviteMemberResult> {
  if (!email || !role || !teamId) {
    return {
      success: false,
      error: 'Email, role, and team ID are required'
    };
  }
  
  try {
    // Verify user has permission to invite members to this team
    const { data: checkResult, error: checkError } = await supabase
      .functions.invoke('check_team_role_permission', {
        body: { 
          team_id: teamId,
          action: 'invite_members' 
        }
      });
    
    if (checkError) {
      throw new Error(`Permission check failed: ${checkError.message}`);
    }
    
    if (!checkResult.can_invite) {
      throw new Error('You do not have permission to invite members to this team');
    }
    
    // Check if the user already belongs to the team
    const { data: existingMember } = await supabase.rpc(
      'check_user_in_team',
      { _email: email, _team_id: teamId }
    );
    
    if (existingMember?.exists) {
      throw new Error('User is already a member of this team');
    }
    
    // Check for existing pending invitations
    const { data: existingInvitations } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('email', email)
      .eq('team_id', teamId)
      .eq('status', 'pending');
    
    if (existingInvitations && existingInvitations.length > 0) {
      throw new Error('This user already has a pending invitation');
    }
    
    // Get current user's session for the invitation details
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;
    
    if (!currentUserId) {
      throw new Error('Authentication required');
    }
    
    // Check if user already exists in the system
    const { data: existingUser } = await supabase
      .rpc('get_user_by_email', { _email: email });
    
    // If the user exists in the system, we can add them directly
    if (existingUser && existingUser.id) {
      // Check if the user is already in the organization of the team
      const { data: team } = await supabase
        .from('team')
        .select('org_id')
        .eq('id', teamId)
        .single();
      
      // Check if user is in org
      const { data: userInOrg } = await supabase
        .rpc('check_user_in_org', { 
          _email: email, 
          _org_id: team.org_id 
        });
      
      if (userInOrg?.exists) {
        // User is in the org, so we can add them directly to the team
        const { data: teamMember, error: addError } = await supabase
          .functions.invoke('add_team_member', {
            body: {
              team_id: teamId,
              user_id: existingUser.id,
              role
            }
          });
        
        if (addError) {
          throw new Error(`Failed to add member: ${addError.message}`);
        }
        
        return {
          success: true,
          data: { directly_added: true }
        };
      }
    }
    
    // Generate a unique token for the invitation
    const token = await generateToken();
    
    // Create the invitation
    const { data: invitation, error: createError } = await supabase
      .from('team_invitations')
      .insert({
        email,
        role,
        team_id: teamId,
        token,
        created_by: currentUserId,
        invited_by_email: sessionData?.session?.user?.email
      })
      .select('id')
      .single();
    
    if (createError) {
      throw new Error(`Failed to create invitation: ${createError.message}`);
    }
    
    // Send the invitation email
    const { error: emailError } = await supabase
      .functions.invoke('send_invitation_email', {
        body: {
          invitation_id: invitation.id,
          type: 'team'
        }
      });
    
    if (emailError) {
      console.warn('Warning: Failed to send invitation email, but invitation was created', emailError);
    }
    
    return {
      success: true,
      data: { invitation_id: invitation.id }
    };
  } catch (error: any) {
    console.error('Error inviting member:', error);
    return {
      success: false,
      error: error.message || 'Failed to send invitation'
    };
  }
}
