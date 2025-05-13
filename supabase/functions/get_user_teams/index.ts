
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

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
    const { user_id } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createAdminClient();
    
    // Get app_user ID for this auth user (for compatibility with existing code)
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .maybeSingle();
      
    if (!appUser?.id) {
      return new Response(
        JSON.stringify({ error: 'User profile not found', teams: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user's profile to determine organization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .maybeSingle();
    
    const userOrgId = userProfile?.org_id;
    
    // 1. Get teams the user is a member of directly
    const { data: teamMemberships } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('user_id', appUser.id);
    
    const teamIds = teamMemberships?.map(tm => tm.team_id) || [];
    
    // 2. Get teams from user's organization
    let orgTeamsIds: string[] = [];
    if (userOrgId) {
      const { data: orgTeams } = await supabase
        .from('team')
        .select('id')
        .eq('org_id', userOrgId)
        .is('deleted_at', null);
        
      orgTeamsIds = (orgTeams || []).map(team => team.id);
    }
    
    // 3. Get organizations where the user has cross-org access
    const { data: accessOrgs } = await supabase
      .from('organization_acl')
      .select('org_id')
      .eq('subject_id', user_id)
      .eq('subject_type', 'user')
      .or('expires_at.gt.now,expires_at.is.null');
      
    const accessOrgIds = (accessOrgs || []).map(access => access.org_id);
    
    // 4. Get teams from organizations where user has access
    let crossOrgTeamIds: string[] = [];
    if (accessOrgIds.length > 0) {
      const { data: crossOrgTeams } = await supabase
        .from('team')
        .select('id')
        .in('org_id', accessOrgIds)
        .is('deleted_at', null);
        
      crossOrgTeamIds = (crossOrgTeams || []).map(team => team.id);
    }
    
    // Combine all team IDs
    const allTeamIds = [...new Set([...teamIds, ...orgTeamsIds, ...crossOrgTeamIds])];
    
    // If no teams found, return empty array
    if (allTeamIds.length === 0) {
      return new Response(
        JSON.stringify({ teams: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get details for all teams
    const { data: teams } = await supabase
      .from('team')
      .select('id, name, org_id')
      .in('id', allTeamIds)
      .is('deleted_at', null);
    
    // Add organization names to each team
    const teamsWithOrgInfo = await Promise.all(
      (teams || []).map(async (team) => {
        if (team.org_id) {
          const { data: org } = await supabase
            .from('organization')
            .select('name')
            .eq('id', team.org_id)
            .single();
            
          const isDirectMember = teamIds.includes(team.id);
          const isSameOrg = team.org_id === userOrgId;
          const isCrossOrgAccess = accessOrgIds.includes(team.org_id);
          
          return {
            ...team,
            org_name: org?.name,
            is_external_org: userOrgId && team.org_id !== userOrgId,
            access_type: isDirectMember ? 'direct_member' : 
                         isSameOrg ? 'same_organization' : 
                         isCrossOrgAccess ? 'cross_org_access' : 'unknown'
          };
        }
        return team;
      })
    );
    
    return new Response(
      JSON.stringify({ teams: teamsWithOrgInfo }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in get_user_teams function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
