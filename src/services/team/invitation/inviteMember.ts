
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';
import { generateUniqueToken } from '@/lib/crypto';

/**
 * Invite a new member to a team with a specific role
 */
export async function inviteMember(
  email: string,
  role: UserRole,
  teamId: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    if (!email || !role || !teamId) {
      throw new Error('Email, role, and team ID are required');
    }
    
    // Check user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(sessionError.message);
    
    const currentUserId = sessionData?.session?.user?.id;
    if (!currentUserId) {
      throw new Error('Authentication required');
    }

    // Check if the user has permission to invite members
    const { data: permission, error: permissionError } = await supabase.functions.invoke('check_team_role_permission', {
      body: { 
        team_id: teamId,
        action: 'invite_member'
      }
    });
    
    if (permissionError) {
      throw new Error(`Permission check failed: ${permissionError.message}`);
    }
    
    if (!permission?.can_invite_members) {
      throw new Error('You do not have permission to invite members to this team');
    }
    
    // Check if user is already in the team
    // Use a direct query instead of RPC
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('team_member')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', (subquery) => 
        subquery.from('user_profiles').select('id').eq('email', email)
      );
      
    if (memberCheckError) {
      throw new Error(`Failed to check team membership: ${memberCheckError.message}`);
    }
    
    if (existingMember && existingMember.length > 0) {
      throw new Error('This user is already a member of this team');
    }

    // Check if the user exists in the system
    const { data: existingUsers, error: userCheckError } = await supabase
      .from('user_profiles')
      .select('id, email, auth_uid')
      .eq('email', email);
      
    if (userCheckError) {
      throw new Error(`Failed to check user: ${userCheckError.message}`);
    }

    // If user exists in the system, add them directly to the team
    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      
      // Check if the user needs to be added to the organization first
      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('org_id')
        .eq('id', teamId)
        .single();
        
      if (teamError) {
        throw new Error(`Failed to get team information: ${teamError.message}`);
      }
      
      // Check if user is in the organization
      // Use a direct query instead of RPC
      const { data: orgMember, error: orgCheckError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('org_id', teamData.org_id)
        .eq('user_id', existingUser.id);
        
      if (orgCheckError) {
        throw new Error(`Failed to check organization membership: ${orgCheckError.message}`);
      }
      
      if (!orgMember || orgMember.length === 0) {
        // Add the user to the organization with a 'member' role
        const { error: addToOrgError } = await supabase.functions.invoke('add_org_member', {
          body: {
            user_id: existingUser.id,
            org_id: teamData.org_id,
            role: 'member'
          }
        });
        
        if (addToOrgError) {
          console.warn(`Warning: Could not add user to organization: ${addToOrgError.message}`);
        }
      }
      
      // Add the user directly to the team
      const { error: addError } = await supabase.functions.invoke('add_team_member', {
        body: {
          team_id: teamId,
          user_id: existingUser.id,
          role
        }
      });
      
      if (addError) {
        throw new Error(`Failed to add member: ${addError.message}`);
      }
      
      // Return success with the directly added flag
      return {
        success: true,
        data: {
          directly_added: true,
          team_id: teamId,
          user_id: existingUser.id,
          role
        }
      };
    }

    // Get team and org information for the invitation
    const { data: teamInfo, error: teamInfoError } = await supabase
      .from('team')
      .select('name, org_id, organization:org_id(name)')
      .eq('id', teamId)
      .single();
      
    if (teamInfoError) {
      throw new Error(`Failed to get team information: ${teamInfoError.message}`);
    }
    
    // Generate a unique token for the invitation
    const token = await generateUniqueToken();
    
    // Use an edge function to send the email
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
      .select('id, email, role, token, team_id')
      .single();
      
    if (createError) {
      throw new Error(`Failed to create invitation: ${createError.message}`);
    }
    
    // Send the invitation email
    const { error: emailError } = await supabase.functions.invoke('send_invitation_email', {
      body: {
        invitation_id: invitation.id,
        type: 'team',
        team_name: teamInfo.name,
        org_name: teamInfo.organization?.name
      }
    });
    
    if (emailError) {
      console.warn(`Warning: Failed to send invitation email: ${emailError.message}`);
    }
    
    return {
      success: true,
      data: invitation
    };
  } catch (error) {
    console.error('Error inviting team member:', error);
    return {
      success: false,
      error: error.message || 'Failed to invite member'
    };
  }
}
