
import { supabase } from "@/integrations/supabase/client";

/**
 * Validate an invitation token
 */
export async function validateInvitationToken(token: string) {
  try {
    console.log("Validating token:", token);
    
    // Check if we're being rate limited first
    try {
      // Try using the validate_invitation edge function if available
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('validate_invitation', {
        body: { token }
      });
      
      // If the edge function worked, use its result
      if (!edgeError && edgeData) {
        console.log("Team invitation validated via edge function:", edgeData.valid);
        return edgeData;
      }
      
      // Check for rate limiting from edge function
      if (edgeError?.status === 429 || edgeError?.message?.includes('429')) {
        console.warn('Rate limit detected in edge function');
        return { 
          valid: false, 
          error: 'Too many requests. Please try again in a moment.', 
          rateLimit: true 
        };
      }
      
      console.log("Falling back to direct DB query for validation");
    } catch (edgeError) {
      console.warn("Edge function error, using direct query:", edgeError);
    }
    
    // Direct database query as fallback
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(id, name)')
      .eq('token', token)
      .eq('status', 'pending')
      .single();
      
    if (error || !data) {
      // Check for rate limiting in direct query
      if (error?.code === '429' || error?.message?.includes('too many requests')) {
        return { 
          valid: false, 
          error: 'Too many requests. Please try again in a moment.', 
          rateLimit: true 
        };
      }
      
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
    
    // Check for rate limiting
    if (error.message?.includes('429') || error.status === 429) {
      return { 
        valid: false, 
        error: 'Too many requests. Please try again in a moment.',
        rateLimit: true 
      };
    }
    
    return { valid: false, error: `Error validating invitation: ${error.message}` };
  }
}
