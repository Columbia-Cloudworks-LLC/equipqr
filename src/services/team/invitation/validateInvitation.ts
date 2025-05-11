
import { supabase } from "@/integrations/supabase/client";

/**
 * Validate an invitation token
 */
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
