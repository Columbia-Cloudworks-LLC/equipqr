
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inline cors headers from _shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create responses
function createJsonResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

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
    const { team_id, user_id } = await req.json();
    
    if (!team_id) {
      return createJsonResponse({ 
        error: 'Missing required parameter: team_id' 
      }, 400);
    }
    
    // If user_id is provided, verify permissions
    if (user_id) {
      // Create admin client to bypass RLS
      const supabase = createAdminClient();
      
      // Check if user has access to this team
      const { data: accessData, error: accessError } = await supabase.rpc('check_team_access_detailed', {
        user_id: user_id,
        team_id: team_id
      });
      
      if (accessError || !accessData?.has_access) {
        console.error('Error checking team access:', accessError);
        return createJsonResponse({ 
          error: 'You do not have permission to view invitations for this team' 
        }, 403);
      }
      
      // Only managers and org owners can see pending invitations
      if (!accessData.is_org_owner && accessData.team_role !== 'manager') {
        return createJsonResponse({ 
          error: 'Only team managers and organization owners can view pending invitations' 
        }, 403);
      }
    }
    
    // Get all pending invitations for this team
    const supabase = createAdminClient(); 
    const { data: invitations, error: invitationsError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', team_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (invitationsError) {
      console.error('Error fetching pending invitations:', invitationsError);
      return createJsonResponse({ 
        error: `Failed to fetch pending invitations: ${invitationsError.message}` 
      }, 500);
    }
    
    return createJsonResponse({ invitations: invitations || [] });
    
  } catch (error: any) {
    console.error('Unexpected error in get_pending_invitations:', error);
    return createJsonResponse({ 
      error: `Server error: ${error.message}` 
    }, 500);
  }
});
