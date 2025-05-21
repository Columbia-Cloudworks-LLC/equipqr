
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';
import { generateUniqueToken } from '@/lib/crypto';

export async function inviteMember(email: string, role: UserRole, teamId: string): Promise<any> {
  try {
    if (!email || !role || !teamId) {
      throw new Error('Email, role, and team ID are required');
    }

    // Get user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('Authentication required');
    }

    const currentUserId = sessionData.session.user.id;
    const currentUserEmail = sessionData.session.user.email;

    // Check if the user has access to this team
    const { data: teamAccess, error: accessError } = await supabase
      .rpc('check_team_access_detailed', {
        user_id: currentUserId,
        team_id: teamId
      });

    if (accessError) {
      throw new Error(`Failed to check team access: ${accessError.message}`);
    }

    // Convert the response to appropriate type
    let accessDetails: { 
      has_access: boolean;
      team_role?: string;
      is_org_owner?: boolean;
    };

    if (Array.isArray(teamAccess)) {
      if (teamAccess.length === 0) {
        throw new Error('You do not have access to this team');
      }
      // Take the first element if it's an array
      accessDetails = {
        has_access: teamAccess[0]?.has_access || false,
        team_role: teamAccess[0]?.team_role,
        is_org_owner: teamAccess[0]?.is_org_owner
      };
    } else {
      accessDetails = teamAccess as any;
    }
    
    // Validate access
    if (!accessDetails.has_access) {
      throw new Error('You do not have access to this team');
    }

    // Only managers or org owners can invite members
    if (accessDetails.team_role !== 'manager' && !accessDetails.is_org_owner) {
      throw new Error('Only team managers or organization owners can invite members');
    }

    // Get team info
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('id, name, org_id')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      throw new Error(`Failed to get team info: ${teamError?.message || 'Team not found'}`);
    }

    // Check if user already exists with this email
    const { data: existingUser, error: userError } = await supabase
      .from('app_user')
      .select('id, auth_uid')
      .ilike('email', email)
      .maybeSingle();

    if (userError) {
      console.error('Error checking existing user:', userError);
    }

    // If user exists, check if already in team
    if (existingUser) {
      const { data: existingMember, error: memberError } = await supabase
        .from('team_member')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('team_id', teamId)
        .maybeSingle();

      if (memberError) {
        console.error('Error checking team membership:', memberError);
      }

      if (existingMember) {
        return {
          success: false,
          error: 'User is already a member of this team'
        };
      }
    }

    // Check for pending invitations
    const { data: pendingInvites, error: inviteCheckError } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('email', email)
      .eq('team_id', teamId)
      .eq('status', 'pending');

    if (inviteCheckError) {
      throw new Error(`Failed to check invitations: ${inviteCheckError.message}`);
    }

    if (pendingInvites && pendingInvites.length > 0) {
      return {
        success: false,
        error: 'This user already has a pending invitation'
      };
    }

    // If user exists and has an account but not in team, directly add them
    if (existingUser) {
      // Get organization info to check if user belongs to same org
      const { data: orgData, error: orgError } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', existingUser.auth_uid)
        .single();

      if (orgError) {
        console.error('Error checking user organization:', orgError);
      }

      // If user is from same org as the team
      if (orgData && orgData.org_id === team.org_id) {
        // Directly add user to the team
        const { data: teamMember, error: createError } = await supabase
          .from('team_member')
          .insert({
            team_id: teamId,
            user_id: existingUser.id,
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to add team member: ${createError.message}`);
        }

        // Assign the role
        const { error: roleError } = await supabase
          .from('team_roles')
          .insert({
            team_member_id: teamMember.id,
            role: role,
            assigned_by: currentUserId
          });

        if (roleError) {
          throw new Error(`Failed to assign role: ${roleError.message}`);
        }

        return {
          success: true,
          directly_added: true,
          message: `${email} was added directly to the team`
        };
      }
    }

    // Generate a unique token for the invitation
    const token = await generateUniqueToken();

    // Create the invitation
    const { data: invitation, error: createError } = await supabase
      .from('team_invitations')
      .insert({
        email,
        role,
        team_id: teamId,
        token,
        created_by: currentUserId,
        invited_by_email: currentUserEmail
      })
      .select('id, email, role, token')
      .single();

    if (createError) {
      throw new Error(`Failed to create invitation: ${createError.message}`);
    }

    // Trigger an email notification using edge function
    const { error: emailError } = await supabase.functions.invoke('send_invitation_email', {
      body: {
        invitation_id: invitation.id,
        type: 'team'
      }
    });

    if (emailError) {
      console.error('Warning: Failed to send invitation email', emailError);
      // We don't throw here because the invitation was created successfully
    }

    return {
      success: true,
      invitation
    };
  } catch (error: any) {
    console.error('Error inviting team member:', error);
    return {
      success: false,
      error: error.message || 'Failed to create invitation'
    };
  }
}
