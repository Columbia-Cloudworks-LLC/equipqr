
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

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
    const { team_id } = await req.json();
    
    if (!team_id) {
      return createResponse({ error: 'Team ID is required' }, 400);
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(team_id)) {
      console.error(`Invalid UUID format for team_id: ${team_id}`);
      return createResponse({ error: 'Invalid team ID format' }, 400);
    }
    
    // Create Supabase admin client with service role to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Fetch team details to verify team exists
    const { data: teamData, error: teamError } = await supabase
      .from('team')
      .select('id, name, org_id')
      .eq('id', team_id)
      .is('deleted_at', null)
      .single();
      
    if (teamError) {
      console.error('Error verifying team:', teamError);
      return createResponse({
        error: 'Team not found',
        details: teamError.message
      }, 404);
    }
    
    // Fetch pending invitations for this team directly using service role
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', team_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching team invitations:', error);
      return createResponse({
        error: 'Failed to fetch invitations',
        details: error.message
      }, 500);
    }
    
    console.log(`Found ${data?.length || 0} pending invitations for team ${team_id}`);
    return createResponse({ invitations: data || [] });
    
  } catch (error) {
    console.error('Unexpected error in get_pending_invitations:', error);
    return createResponse({
      error: 'Server error',
      details: error.message
    }, 500);
  }
});
