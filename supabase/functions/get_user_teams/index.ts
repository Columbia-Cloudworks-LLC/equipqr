
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inlined CORS headers from _shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Inlined success response function from _shared/cors.ts
function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200 
    }
  );
}

// Inlined error response function from _shared/cors.ts
function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }, 
      status 
    }
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, include_all_orgs = false } = await req.json();
    
    if (!user_id) {
      return createErrorResponse("Missing required user_id parameter");
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get user's app_user ID from auth_uid
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .single();
    
    if (appUserError || !appUser) {
      console.error('Error finding app_user:', appUserError);
      return createErrorResponse('User not found');
    }
    
    const appUserId = appUser.id;
    
    // Get user's organization for determining external teams
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
    
    if (profileError) {
      console.error('Error finding user profile:', profileError);
      return createErrorResponse('User profile not found');
    }
    
    const userOrgId = userProfile.org_id;
    
    // Get teams the user is a direct member of
    const { data: memberTeams, error: memberTeamsError } = await supabase
      .from('team_member')
      .select(`
        team_id,
        team:team_id (
          id,
          name,
          org_id,
          org:org_id (name)
        ),
        team_roles (role)
      `)
      .eq('user_id', appUserId)
      .is('team:deleted_at', null);
    
    if (memberTeamsError) {
      console.error('Error getting member teams:', memberTeamsError);
      return createErrorResponse('Failed to get team memberships');
    }
    
    // If include_all_orgs is false, we need extra teams the user can access through org-level roles
    let extraTeams = [];
    
    if (include_all_orgs) {
      // Get all organizations where user has a role of manager or higher
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('user_roles')
        .select(`
          org_id,
          role,
          org:org_id (name)
        `)
        .eq('user_id', user_id)
        .in('role', ['owner', 'manager', 'admin']);
      
      if (userOrgsError) {
        console.error('Error getting user organizations:', userOrgsError);
      } else if (userOrgs && userOrgs.length > 0) {
        // For each org where user has manager+ role, get all teams
        const orgIds = userOrgs.map(o => o.org_id);
        
        // Get all teams from these organizations
        const { data: orgTeams, error: orgTeamsError } = await supabase
          .from('team')
          .select(`
            id,
            name,
            org_id,
            org:org_id (name)
          `)
          .in('org_id', orgIds)
          .is('deleted_at', null);
        
        if (orgTeamsError) {
          console.error('Error getting org teams:', orgTeamsError);
        } else if (orgTeams) {
          // Filter out teams the user is already a direct member of
          const memberTeamIds = new Set(memberTeams?.map(t => t.team_id) || []);
          
          extraTeams = orgTeams
            .filter(team => !memberTeamIds.has(team.id))
            .map(team => {
              // Find the user's role in this org
              const userOrg = userOrgs.find(o => o.org_id === team.org_id);
              
              return {
                team_id: team.id,
                team: {
                  id: team.id,
                  name: team.name,
                  org_id: team.org_id,
                  org: team.org
                },
                team_roles: [{
                  role: userOrg?.role || 'manager' // Default to manager if role not found
                }],
                is_from_org_role: true
              };
            });
        }
      }
    }
    
    // Combine direct memberships and org-level access teams
    const allTeamMemberships = [...(memberTeams || []), ...extraTeams];
    
    // Process and format the result
    const teams = allTeamMemberships.map(membership => {
      const team = membership.team;
      const roles = membership.team_roles || [];
      const role = roles.length > 0 ? roles[0].role : 'viewer';
      
      return {
        id: team.id,
        name: team.name,
        role: role,
        org_id: team.org_id,
        org_name: team.org?.name || 'Unknown Organization',
        is_external: team.org_id !== userOrgId,
        is_from_org_role: membership.is_from_org_role || false
      };
    });
    
    return createSuccessResponse({ teams });
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Server error: ' + error.message);
  }
});
