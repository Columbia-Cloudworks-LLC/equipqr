
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/permissions.ts';

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
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createAdminClient();
    
    // Get pending invitations for the email
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select('id, email, team_id, role, token, created_at, expires_at, status')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending');
    
    if (error) {
      throw error;
    }
    
    // Get team information for each invitation
    const invitationsWithTeamInfo = await Promise.all(
      (invitations || []).map(async (invitation) => {
        // Get team details
        const { data: team } = await supabase
          .from('team')
          .select('name, org_id')
          .eq('id', invitation.team_id)
          .single();
        
        // Get organization details
        let orgName = null;
        if (team?.org_id) {
          const { data: org } = await supabase
            .from('organization')
            .select('name')
            .eq('id', team.org_id)
            .single();
            
          orgName = org?.name;
        }
        
        return {
          ...invitation,
          team: {
            id: invitation.team_id,
            name: team?.name || 'Unknown Team',
            org_id: team?.org_id
          },
          org_name: orgName
        };
      })
    );
    
    return new Response(
      JSON.stringify({ invitations: invitationsWithTeamInfo }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in get_user_invitations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
