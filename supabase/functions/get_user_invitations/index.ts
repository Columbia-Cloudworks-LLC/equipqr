
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
    
    // Fetch pending invitations for this email directly using service role
    const { data, error } = await supabase
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
      
    if (error) {
      console.error('Error fetching user invitations:', error);
      return createResponse({
        error: 'Failed to fetch invitations',
        details: error.message
      }, 500);
    }
    
    // Process invitations to include team and org information
    const processedInvitations = data?.map(invite => ({
      ...invite,
      team_name: invite.team?.name || 'Unknown Team',
      org_name: invite.team?.organization?.name || 'Unknown Organization',
    })) || [];
    
    console.log(`Found ${processedInvitations.length} pending invitations for ${normalizedEmail}`);
    return createResponse({ invitations: processedInvitations });
    
  } catch (error) {
    console.error('Unexpected error in get_user_invitations:', error);
    return createResponse({
      error: 'Server error',
      details: error.message
    }, 500);
  }
});
