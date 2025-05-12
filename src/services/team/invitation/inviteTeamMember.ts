
import { supabase } from "@/integrations/supabase/client";
import { generateToken, sendInvitationEmail } from './invitationHelpers';
import { UserRole } from "@/types/supabase-enums";

/**
 * Invite a user to join a team
 */
export async function inviteMember(email: string, role: UserRole, teamId: string) {
  try {
    console.log(`Sending invitation to ${email} for role ${role} in team ${teamId}`);
    
    // Get the current user's session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to send invitations');
    }
    
    // Check if the user is already part of the team using our function
    const { data: existingUserArray, error: userCheckError } = await supabase.rpc(
      'get_user_by_email',
      { email_address: email.toLowerCase() }
    );
    
    if (userCheckError) {
      console.error('Error checking if user exists:', userCheckError);
      // Continue with invitation flow since we can't confirm if user exists
    }
    
    // Get team details to include in the invitation
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('name, org_id')
      .eq('id', teamId)
      .single();
      
    if (teamError) {
      console.error('Error fetching team details:', teamError);
      throw new Error(`Failed to find team: ${teamError.message}`);
    }
    
    // Generate a unique token for the invitation
    const token = await generateToken();
    
    // Save the invitation in the database
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        email: email.toLowerCase(),
        team_id: teamId,
        role: role,
        token: token,
        created_by: sessionData.session.user.id,
        invited_by_email: sessionData.session.user.email
      })
      .select()
      .single();
      
    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      throw new Error(`Failed to create invitation: ${inviteError.message}`);
    }
    
    // Extract the existing user from the array (if it exists)
    const existingUser = existingUserArray && existingUserArray.length > 0 ? existingUserArray[0] : null;
    
    // If we found an existing user, create a cross-org access entry
    if (existingUser?.auth_uid) {
      try {
        // Add organization_acl entry to grant temporary cross-org access
        const { error: aclError } = await supabase
          .from('organization_acl')
          .insert({
            org_id: team.org_id,
            subject_id: existingUser.auth_uid,
            subject_type: 'user',
            role: 'viewer',
            // Add expiration date for temporary access (14 days)
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          });
        
        if (aclError) {
          console.error('Error creating organization ACL entry:', aclError);
          // Continue with invitation flow even if ACL creation fails
        } else {
          console.log('Created temporary organization access for invited user');
        }
      } catch (aclCreateError) {
        console.error('Error in creating organization ACL entry:', aclCreateError);
        // Continue with invitation flow even if ACL creation fails
      }
    }
    
    // If the user exists, we can add them directly to the team
    let directlyAdded = false;
    if (existingUser?.id) {
      try {
        // Try to add the user directly to the team
        const { data: directAdd, error: directAddError } = await supabase.functions.invoke('add_team_member', {
          body: {
            _team_id: teamId,
            _user_id: existingUser.id,
            _role: role,
            _added_by: sessionData.session.user.id
          }
        });
        
        if (!directAddError) {
          directlyAdded = true;
          console.log(`User ${email} was directly added to team ${teamId}`);
          
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
            // Not critical, continue
          }
        }
      } catch (directError) {
        console.error('Error directly adding user to team:', directError);
        // Continue with invitation flow as fallback
      }
    }
    
    // Send invitation email if user wasn't directly added
    if (!directlyAdded) {
      await sendInvitationEmail({
        recipientEmail: email,
        teamName: team.name,
        inviterEmail: sessionData.session.user.email,
        inviterName: sessionData.session.user.user_metadata?.display_name,
        token: token,
        action: 'invite',
        role
      });
    }
    
    return { 
      success: true, 
      directlyAdded,
      invitationId: invitation.id
    };
  } catch (error: any) {
    console.error('Error in inviteMember:', error);
    throw new Error(`Failed to send invitation: ${error.message}`);
  }
}
