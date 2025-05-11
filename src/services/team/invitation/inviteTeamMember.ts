
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/supabase-enums";
import { sendInvitationEmail, generateToken } from "./invitationHelpers";

/**
 * Invite a new member to a team
 */
export async function inviteMember(email: string, role: UserRole, teamId: string) {
  try {
    // Get the current user's ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to invite a team member');
    }
    
    const currentAuthUserId = sessionData.session.user.id;
    console.log(`Current auth user ID: ${currentAuthUserId}`);
    
    // Check if the user already exists in the system by email
    const { data: existingUser, error: userError } = await supabase
      .from('app_user')
      .select('id, auth_uid')
      .eq('email', email.toLowerCase())
      .maybeSingle();
      
    if (userError) {
      console.error('Error checking existing user:', userError);
      throw new Error(`Failed to check if user exists: ${userError.message}`);
    }

    // Validate teamId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(teamId)) {
      console.error(`Invalid UUID format for teamId: ${teamId}`);
      throw new Error("Invalid team ID format. Please select a valid team.");
    }

    // First check if the current user is a member of the team
    const { data: currentUserMembership, error: membershipError } = await supabase.functions.invoke('validate_team_access', {
      body: {
        team_id: teamId,
        user_id: currentAuthUserId
      }
    });

    if (membershipError || !currentUserMembership?.is_member) {
      console.error('Error verifying team membership:', membershipError || 'Not a team member');
      throw new Error('You do not have permission to invite members to this team.');
    }

    // Get team name for the email
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('name')
      .eq('id', teamId)
      .single();
      
    if (teamError) {
      console.error('Error fetching team details:', teamError);
      throw new Error(`Failed to fetch team details: ${teamError.message}`);
    }
    
    console.log(`Inviting ${email} with role ${role} to team ${teamId} (${team.name})`);
    
    // If the user exists, add them to the team directly
    if (existingUser) {
      try {
        console.log(`Existing user found with auth_uid: ${existingUser.auth_uid}`);
        
        const { data, error: addError } = await supabase.functions.invoke('add_team_member', {
          body: {
            _team_id: teamId,
            _user_id: existingUser.auth_uid, 
            _role: role,
            _added_by: currentAuthUserId
          }
        });
        
        if (addError) {
          console.error('Error adding member to team:', addError);
          throw new Error(`Failed to add member to team: ${addError.message}`);
        }
        
        console.log('Team member added successfully:', data);
        
        // Send notification email to the added user
        await sendInvitationEmail({
          recipientEmail: email,
          teamName: team.name,
          inviterEmail: sessionData.session.user.email || "",
          token: "direct-add", // No token needed for direct adds
          action: "invite",
          role: role
        });
        
        return { success: true, directlyAdded: true };
      } catch (addError: any) {
        console.error('Error adding member to team:', addError);
        throw new Error(`Failed to add member to team: ${addError.message}`);
      }
    }
    
    // Generate a token for the invitation
    const token = await generateToken();
    
    // User doesn't exist, create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email: email.toLowerCase(),
        role: role,
        created_by: currentAuthUserId,
        invited_by_email: sessionData.session.user.email,
        token: token,
        status: 'pending'
      })
      .select()
      .single();
      
    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      throw new Error(`Failed to create invitation: ${inviteError.message}`);
    }
    
    console.log('Invitation created:', invitation);
    
    // Send the invitation email
    await sendInvitationEmail({
      recipientEmail: email,
      teamName: team.name,
      inviterEmail: sessionData.session.user.email || "",
      inviterName: sessionData.session.user.user_metadata?.name,
      token: token,
      action: "invite",
      role: role
    });
    
    return { success: true, pendingInvite: true };
  } catch (error: any) {
    console.error('Error in inviteMember:', error);
    throw new Error(`Invitation failed: ${error.message}`);
  }
}
