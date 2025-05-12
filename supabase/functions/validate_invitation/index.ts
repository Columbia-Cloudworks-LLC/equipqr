import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/index.ts';

// Create a Supabase client with admin privileges
function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables for Supabase client');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    
    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing required parameter: token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createAdminClient();
    
    // Validate the invitation token
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .select('id, email, team_id, role, token, created_at, expires_at, status, invited_by_email')
      .eq('token', token)
      .eq('status', 'pending')
      .single();
      
    if (error || !invitation) {
      console.error('Error validating invitation token:', error);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid or expired invitation link.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the invitation has expired
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'This invitation has expired.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get team information
    const { data: team } = await supabase
      .from('team')
      .select('name, org_id')
      .eq('id', invitation.team_id)
      .single();
      
    // Get organization information if available
    let orgName = null;
    if (team?.org_id) {
      const { data: org } = await supabase
        .from('organization')
        .select('name')
        .eq('id', team.org_id)
        .single();
        
      orgName = org?.name;
    }
    
    const responseData = {
      valid: true,
      invitation: {
        ...invitation,
        team: team || { name: 'Unknown Team' },
        org_name: orgName
      }
    };
    
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in validate_invitation function:', error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
