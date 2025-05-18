
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Cors headers are needed for the client to receive the response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing environment variables for Supabase connection');
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

// Helper function to get the effective role based on team and org roles
function getEffectiveRole(teamRole: string | null, orgRole: string | null): string | null {
  if (!teamRole && !orgRole) return null;
  if (!teamRole) return orgRole;
  if (!orgRole) return teamRole;
  
  // Define role hierarchy from highest to lowest permission level
  const roleHierarchy = ['owner', 'admin', 'manager', 'creator', 'technician', 'viewer', 'member'];
  
  const teamRoleIndex = roleHierarchy.indexOf(teamRole);
  const orgRoleIndex = roleHierarchy.indexOf(orgRole);
  
  // If role isn't in our hierarchy, default to the other role
  if (teamRoleIndex === -1) return orgRole;
  if (orgRoleIndex === -1) return teamRole;
  
  // Lower index = higher permission
  return teamRoleIndex < orgRoleIndex ? teamRole : orgRole;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { team_id, user_id } = await req.json();
    
    if (!team_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createAdminClient();
    
    // Get team information
    const { data: teamData, error: teamError } = await supabase
      .from('team')
      .select('org_id, created_by')
      .eq('id', team_id)
      .single();
    
    if (teamError || !teamData) {
      return new Response(
        JSON.stringify({ error: teamError?.message || 'Team not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user is the team creator
    const isTeamCreator = teamData.created_by === user_id;
    
    // Get user organization
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
    
    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Organization owners and managers can change roles in teams in their org
    if (userData.org_id === teamData.org_id) {
      const { data: orgRole, error: orgRoleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user_id)
        .eq('org_id', userData.org_id)
        .maybeSingle();
      
      if (!orgRoleError && orgRole && ['owner', 'manager'].includes(orgRole.role)) {
        return new Response(
          JSON.stringify({ 
            hasPermission: true, 
            reason: `org_role:${orgRole.role}`,
            roleSource: 'organization'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // If user is the team creator, they can change roles
    if (isTeamCreator) {
      return new Response(
        JSON.stringify({ 
          hasPermission: true, 
          reason: 'team_creator',
          roleSource: 'creator'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user is a team manager
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .single();
    
    if (appUser?.id) {
      const { data: teamMember } = await supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', team_id)
        .maybeSingle();
      
      if (teamMember?.id) {
        const { data: teamRole } = await supabase
          .from('team_roles')
          .select('role')
          .eq('team_member_id', teamMember.id)
          .maybeSingle();
        
        if (teamRole?.role === 'manager') {
          return new Response(
            JSON.stringify({ 
              hasPermission: true, 
              reason: 'team_manager',
              roleSource: 'team'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    
    // No permission found
    return new Response(
      JSON.stringify({ 
        hasPermission: false, 
        reason: 'insufficient_permissions'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
