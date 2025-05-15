
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inlined CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Inlined success response function
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

// Inlined error response function
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body for user_id
    const { user_id } = await req.json();
    
    if (!user_id) {
      return createErrorResponse("Missing required parameter: user_id");
    }

    // Create Supabase admin client to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    // Get the user's organization ID for determining external teams
    const { data: userProfile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return createErrorResponse(`Failed to fetch user profile: ${profileError.message}`);
    }
    
    const userOrgId = userProfile?.org_id;
    
    // First get teams from user's organization
    const { data: orgTeams, error: orgTeamsError } = await adminClient
      .from('team')
      .select(`
        id, 
        name,
        org_id,
        organization:org_id (name)
      `)
      .eq('org_id', userOrgId)
      .is('deleted_at', null);
      
    if (orgTeamsError) {
      console.error('Error fetching org teams:', orgTeamsError);
      return createErrorResponse(`Failed to fetch organization teams: ${orgTeamsError.message}`);
    }
      
    // Get app_user.id for this auth user
    const { data: appUser, error: appUserError } = await adminClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .single();
      
    if (appUserError) {
      console.error('Error fetching app user:', appUserError);
      return createErrorResponse(`Failed to fetch app user: ${appUserError.message}`);
    }
    
    // Get teams where user is a member (might be from other organizations)
    const appUserId = appUser?.id;
    let externalTeams: any[] = [];
    
    if (appUserId) {
      // Get team memberships
      const { data: teamMemberships, error: membershipsError } = await adminClient
        .from('team_member')
        .select('team_id')
        .eq('user_id', appUserId);
        
      if (membershipsError) {
        console.error('Error fetching team memberships:', membershipsError);
        return createErrorResponse(`Failed to fetch team memberships: ${membershipsError.message}`);
      }
      
      if (teamMemberships && teamMemberships.length > 0) {
        const teamIds = teamMemberships.map(tm => tm.team_id);
        
        // Get details for these teams
        const { data: memberTeams, error: memberTeamsError } = await adminClient
          .from('team')
          .select(`
            id,
            name,
            org_id,
            organization:org_id (name)
          `)
          .in('id', teamIds)
          .is('deleted_at', null);
          
        if (memberTeamsError) {
          console.error('Error fetching member teams:', memberTeamsError);
          return createErrorResponse(`Failed to fetch member teams: ${memberTeamsError.message}`);
        }
        
        // Get team roles
        const teamRolePromises = teamMemberships.map(async (tm) => {
          const { data: teamMember } = await adminClient
            .from('team_member')
            .select('id')
            .eq('user_id', appUserId)
            .eq('team_id', tm.team_id)
            .single();
            
          if (!teamMember) return { team_id: tm.team_id, role: null };
          
          const { data: teamRole } = await adminClient
            .from('team_roles')
            .select('role')
            .eq('team_member_id', teamMember.id)
            .single();
            
          return { team_id: tm.team_id, role: teamRole?.role };
        });
        
        const teamRoles = await Promise.all(teamRolePromises);
        
        // Find teams from other organizations
        externalTeams = (memberTeams || [])
          .filter(team => team.org_id !== userOrgId)
          .map(team => {
            const roleInfo = teamRoles.find(tr => tr.team_id === team.id);
            return {
              id: team.id,
              name: team.name,
              org_id: team.org_id,
              org_name: team.organization?.name,
              is_external: true,
              role: roleInfo?.role
            };
          });
      }
    }
    
    // Format org teams
    const formattedOrgTeams = (orgTeams || []).map(team => ({
      id: team.id,
      name: team.name,
      org_id: team.org_id,
      org_name: team.organization?.name,
      is_external: false,
      role: 'member' // Default role for org teams
    }));
    
    // Combine all teams
    const allTeams = [...formattedOrgTeams, ...externalTeams];
    
    return createSuccessResponse({ teams: allTeams });
  } catch (error) {
    console.error('Unexpected error in get_user_teams:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
