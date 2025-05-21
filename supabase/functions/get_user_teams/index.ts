
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createAdminClient } from "../_shared/adminClient.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { user_id, org_id } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id parameter" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const adminClient = createAdminClient();
    
    // Get app_user ID for this auth user
    const { data: appUserData, error: appUserError } = await adminClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .single();
    
    if (appUserError) {
      console.error('Error getting app_user ID:', appUserError);
      return new Response(
        JSON.stringify({ error: "Could not find app_user record" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    const appUserId = appUserData.id;
    
    // Get user's organization ID
    const { data: userProfile, error: userProfileError } = await adminClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
    
    if (userProfileError) {
      console.error('Error getting user profile:', userProfileError);
    }
    
    const userOrgId = userProfile?.org_id;
    
    // 1. Get teams the user is a member of
    let memberTeamsQuery = adminClient
      .from('team')
      .select(`
        *,
        org:org_id (
          id,
          name
        ),
        members:team_member(
          id,
          user:user_id (
            id,
            email
          ),
          roles:team_roles (
            role
          )
        )
      `)
      .eq('team_member.user_id', appUserId);
      
    // Add organization filter if specified
    if (org_id) {
      memberTeamsQuery = memberTeamsQuery.eq('org_id', org_id);
    }
    
    const { data: memberTeams, error: memberTeamsError } = await memberTeamsQuery;
    
    if (memberTeamsError) {
      console.error('Error getting member teams:', memberTeamsError);
    }
    
    // 2. Get teams in the user's organization or specified organization
    let orgFilter = userOrgId;
    if (org_id) {
      orgFilter = org_id;
    }
    
    let orgTeamsQuery = adminClient
      .from('team')
      .select(`
        *,
        org:org_id (
          id,
          name
        )
      `);
    
    if (orgFilter) {
      orgTeamsQuery = orgTeamsQuery.eq('org_id', orgFilter);
    } else {
      // No org filter available
      return new Response(
        JSON.stringify({ teams: memberTeams || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    const { data: orgTeams, error: orgTeamsError } = await orgTeamsQuery;
    
    if (orgTeamsError) {
      console.error('Error getting organization teams:', orgTeamsError);
    }
    
    // Combine and deduplicate teams from both queries
    const allTeams = [...(memberTeams || []), ...(orgTeams || [])];
    const uniqueTeams = allTeams.filter((team, index, self) =>
      index === self.findIndex((t) => t.id === team.id)
    );
    
    // Process and return teams
    const processedTeams = uniqueTeams
      .filter(team => !team.deleted_at)
      .map(team => {
        // Get user's role in this team, if any
        const memberData = team.members?.find(m => m.user?.id === appUserId);
        const role = memberData?.roles?.[0]?.role || null;
        
        // Check if the team is from the user's own organization
        const isExternal = userOrgId && team.org_id !== userOrgId;
        
        return {
          id: team.id,
          name: team.name,
          org_id: team.org_id,
          org_name: team.org?.name || 'Unknown Organization',
          is_external: isExternal,
          role: role,
          created_at: team.created_at,
          has_access: true // User must have access if they can see it
        };
      });
    
    return new Response(
      JSON.stringify({ teams: processedTeams }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
