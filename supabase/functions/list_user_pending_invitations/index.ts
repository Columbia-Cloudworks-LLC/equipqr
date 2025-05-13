
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/adminClient.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return createErrorResponse("Missing required parameter: email");
    }

    const supabase = createAdminClient();
    
    // Get all pending invitations for this email
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        team:team_id (name, org_id)
      `)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .lt('expires_at', 'now()')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching invitations:', error);
      return createErrorResponse(`Failed to fetch invitations: ${error.message}`);
    }
    
    // Add org name for each invitation
    const invitationsWithOrgDetails = await Promise.all(invitations.map(async (invitation) => {
      if (invitation.team?.org_id) {
        const { data: org } = await supabase
          .from('organization')
          .select('name')
          .eq('id', invitation.team.org_id)
          .single();
          
        return {
          ...invitation,
          org_name: org?.name || 'Unknown Organization'
        };
      }
      return invitation;
    }));
    
    // Return the invitations list directly
    return createSuccessResponse(invitationsWithOrgDetails);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
