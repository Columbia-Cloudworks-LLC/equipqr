
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/supabase-enums";
import { toast } from "sonner";

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

export async function resendInvite(invitationId: string) {
  try {
    // Get the invitation details
    const { data: invitation, error: getError } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(name)')
      .eq('id', invitationId)
      .single();
      
    if (getError || !invitation) {
      console.error('Error getting invitation:', getError);
      throw new Error('Failed to find the invitation.');
    }
    
    // Generate a new token and update the invitation
    const newToken = await generateToken();
    
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ 
        token: newToken,
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', invitationId);
      
    if (updateError) {
      console.error('Error updating invitation:', updateError);
      throw new Error(`Failed to update invitation: ${updateError.message}`);
    }

    // Get current user's email for the from field
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserEmail = sessionData?.session?.user?.email || invitation.invited_by_email;
    
    // Send the invitation email with the new token
    await sendInvitationEmail({
      recipientEmail: invitation.email,
      teamName: invitation.team.name,
      inviterEmail: currentUserEmail,
      token: newToken,
      action: "resend",
      role: invitation.role
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in resendInvite:', error);
    throw new Error(`Resend invitation failed: ${error.message}`);
  }
}

// Function to get pending invitations for a team
export async function getPendingInvitations(teamId: string) {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'pending');
      
    if (error) {
      console.error('Error fetching pending invitations:', error);
      throw new Error(`Failed to fetch pending invitations: ${error.message}`);
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Error in getPendingInvitations:', error);
    throw new Error(`Failed to get pending invitations: ${error.message}`);
  }
}

// Function to cancel an invitation
export async function cancelInvitation(invitationId: string) {
  try {
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);
      
    if (error) {
      console.error('Error cancelling invitation:', error);
      throw new Error(`Failed to cancel invitation: ${error.message}`);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in cancelInvitation:', error);
    throw new Error(`Failed to cancel invitation: ${error.message}`);
  }
}

// Function to validate an invitation token
export async function validateInvitationToken(token: string) {
  try {
    console.log("Validating token:", token);
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(id, name)')
      .eq('token', token)
      .eq('status', 'pending')
      .single();
      
    if (error || !data) {
      console.error('Error validating invitation token:', error);
      return { valid: false, error: 'Invalid or expired invitation link.' };
    }
    
    console.log("Invitation found:", data);
    
    // Ensure team information is present
    if (!data.team || !data.team.name) {
      console.warn("Team information missing in invitation:", data);
      
      // Try to fetch team information separately
      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('name')
        .eq('id', data.team_id)
        .single();
        
      if (!teamError && teamData) {
        data.team = { id: data.team_id, name: teamData.name };
      } else {
        console.error("Failed to fetch team information:", teamError);
      }
    }
    
    // Check if the invitation has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'This invitation has expired.', invitation: data };
    }
    
    return { valid: true, invitation: data };
  } catch (error: any) {
    console.error('Error in validateInvitationToken:', error);
    return { valid: false, error: `Error validating invitation: ${error.message}` };
  }
}

// Function to accept an invitation
export async function acceptInvitation(token: string) {
  try {
    console.log("Accepting invitation with token:", token);
    // First validate the token
    const { valid, invitation, error } = await validateInvitationToken(token);
    
    if (!valid || !invitation) {
      throw new Error(error || 'Invalid invitation token.');
    }
    
    // Get the current user's ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to accept an invitation.');
    }
    
    const currentUserId = sessionData.session.user.id;
    console.log("Current user ID:", currentUserId);
    console.log("Invitation data:", invitation);
    
    // Add the user to the team with the specified role
    const { data, error: addError } = await supabase.functions.invoke('add_team_member', {
      body: {
        _team_id: invitation.team_id,
        _user_id: currentUserId,
        _role: invitation.role,
        _added_by: currentUserId
      }
    });
    
    if (addError) {
      console.error('Error adding user to team:', addError);
      throw new Error(`Failed to add you to the team: ${addError.message}`);
    }
    
    console.log("User successfully added to team:", data);
    
    // Mark the invitation as accepted
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);
      
    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      // Don't throw here - the user is already added to the team
      toast.error('Could not mark invitation as accepted, but you were added to the team.');
    }
    
    const teamName = invitation.team?.name || "the team";
    
    return { 
      success: true,
      teamId: invitation.team_id,
      teamName: teamName,
      role: invitation.role
    };
  } catch (error: any) {
    console.error('Error in acceptInvitation:', error);
    throw new Error(`Failed to accept invitation: ${error.message}`);
  }
}

// Helper function to send invitation emails
async function sendInvitationEmail({
  recipientEmail,
  teamName,
  inviterEmail,
  inviterName,
  token,
  action,
  role
}: {
  recipientEmail: string;
  teamName: string;
  inviterEmail: string;
  inviterName?: string;
  token: string;
  action: "invite" | "resend";
  role: string;
}) {
  try {
    // Skip sending emails for direct adds (existing users added directly to team)
    if (token === "direct-add") {
      console.log("User added directly to team, skipping invitation email");
      return true;
    }
    
    console.log(`Sending ${action} email to ${recipientEmail} for team ${teamName}`);
    
    const { error } = await supabase.functions.invoke('send_invitation_email', {
      body: {
        recipientEmail,
        teamName,
        inviterEmail,
        inviterName,
        token,
        action,
        role
      }
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      toast.error("Invitation created, but email could not be sent. User can still accept via invitation link.");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in sendInvitationEmail:', error);
    toast.error("Invitation created, but email could not be sent. User can still accept via invitation link.");
    return false;
  }
}

// Helper function to generate a token
async function generateToken() {
  try {
    // Call the gen_invitation_token function
    const { data, error } = await supabase.rpc('gen_invitation_token');
    
    if (error) {
      console.error('Error generating token:', error);
      // Fallback to client-side token generation
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    return data;
  } catch (error) {
    console.error('Error in generateToken:', error);
    // Fallback to client-side token generation
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
