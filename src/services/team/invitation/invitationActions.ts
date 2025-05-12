
import { supabase } from "@/integrations/supabase/client";
import { sendInvitationEmail, generateToken } from "./invitationHelpers";
import { toast } from "sonner";

/**
 * Resend an invitation to a pending team member
 */
export async function resendInvite(invitationId: string) {
  try {
    // Get the invitation details using direct query instead of joins that might trigger recursion
    const { data: invitation, error: getError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();
      
    if (getError || !invitation) {
      console.error('Error getting invitation:', getError);
      throw new Error('Failed to find the invitation.');
    }
    
    // Get team details separately to avoid join recursion
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('name')
      .eq('id', invitation.team_id)
      .single();
      
    if (teamError) {
      console.error('Error getting team details:', teamError);
      throw new Error('Failed to get team details.');
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
      teamName: team.name,
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

/**
 * Get pending invitations for a team
 */
export async function getPendingInvitations(teamId: string) {
  try {
    // Use edge function or direct query with admin role instead of RLS-protected queries
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

/**
 * Cancel a pending invitation
 */
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
