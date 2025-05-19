
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inline cors headers from _shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a response with CORS headers
function createResponse(body: any, status = 200) {
  return new Response(
    JSON.stringify(body),
    { 
      status, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return createResponse({ error: 'Email is required' }, 400);
    }
    
    // Create Supabase admin client with service role to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // 1. Fetch team invitations
    const { data: teamInvitations, error: teamError } = await supabase
      .from('team_invitations')
      .select(`
        *,
        team:team_id (
          id,
          name,
          org_id,
          organization:org_id (
            name
          )
        )
      `)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      
    if (teamError) {
      console.error('Error fetching team invitations:', teamError);
      return createResponse({
        error: 'Failed to fetch team invitations',
        details: teamError.message
      }, 500);
    }
    
    // 2. Fetch organization invitations
    const { data: orgInvitations, error: orgError } = await supabase
      .from('organization_invitations')
      .select(`
        *,
        organization:org_id (
          id,
          name
        )
      `)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (orgError) {
      console.error('Error fetching organization invitations:', orgError);
      return createResponse({
        error: 'Failed to fetch organization invitations',
        details: orgError.message
      }, 500);
    }
    
    // Process team invitations to include team and org information
    const processedTeamInvitations = teamInvitations?.map(invite => ({
      ...invite,
      invitationType: 'team',
      team_name: invite.team?.name || 'Unknown Team',
      org_name: invite.team?.organization?.name || 'Unknown Organization',
    })) || [];
    
    // Process organization invitations to match the expected structure for the frontend
    const processedOrgInvitations = orgInvitations?.map(invite => ({
      ...invite,
      invitationType: 'organization',
      team: null,
      team_name: null,
      org_name: invite.organization?.name || 'Unknown Organization',
      // Fields required to match the team invitations structure
      team_id: null,
      role: invite.role || 'member',
    })) || [];
    
    // Combine both types of invitations
    const allInvitations = [...processedTeamInvitations, ...processedOrgInvitations];
    
    console.log(`Found ${processedTeamInvitations.length} team invitations and ${processedOrgInvitations.length} organization invitations for ${normalizedEmail}`);
    return createResponse({ invitations: allInvitations });
    
  } catch (error) {
    console.error('Unexpected error in get_user_invitations:', error);
    return createResponse({
      error: 'Server error',
      details: error.message
    }, 500);
  }
});
