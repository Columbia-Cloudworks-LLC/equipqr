
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateInvitationToken } from "./validateInvitation";

/**
 * Accept an invitation to join a team
 */
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
    
    // Get the team's organization ID to add cross-org access
    const { data: team } = await supabase
      .from('team')
      .select('org_id')
      .eq('id', invitation.team_id)
      .single();
      
    if (team?.org_id) {
      // First check for existing ACL entry that might be temporary
      const { data: existingAcl } = await supabase
        .from('organization_acl')
        .select('id')
        .eq('org_id', team.org_id)
        .eq('subject_id', currentUserId)
        .eq('subject_type', 'user')
        .maybeSingle();
        
      if (existingAcl?.id) {
        // Update the existing ACL entry to remove expiration (make permanent)
        await supabase
          .from('organization_acl')
          .update({ expires_at: null })
          .eq('id', existingAcl.id);
          
        console.log('Updated existing organization access to permanent');
      } else {
        // Create a permanent ACL entry (no expiration)
        await supabase
          .from('organization_acl')
          .insert({
            org_id: team.org_id,
            subject_id: currentUserId,
            subject_type: 'user',
            role: invitation.role === 'manager' ? 'manager' : 'viewer'
          });
          
        console.log('Added permanent organization access for user');
      }
    }
    
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
