
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { 
  corsHeaders,
  createErrorResponse,
  createSuccessResponse
} from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { team_id, user_id } = await req.json();
    
    if (!team_id || !user_id) {
      return createErrorResponse("Missing required parameters: team_id and user_id");
    }

    // Create regular Supabase client - no admin bypass needed with our security definer functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // First, get the team's organization ID
    const { data: teamData } = await supabase.rpc('get_team_org', { 
      team_id_param: team_id 
    });
    
    if (!teamData) {
      return createErrorResponse("Team not found");
    }
    
    const teamOrgId = teamData;
    
    // Check if user has an org-level role that allows equipment creation
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .eq('org_id', teamOrgId)
      .maybeSingle();
      
    if (userRoles?.role === 'owner' || userRoles?.role === 'manager') {
      return createSuccessResponse({ 
        can_create: true, 
        reason: 'org_role',
        org_id: teamOrgId,
        role: userRoles.role
      });
    }
    
    // Check if user is a team member with appropriate role
    const { data: teamRole } = await supabase.rpc('get_team_role_safe', {
      _user_id: user_id,
      _team_id: team_id
    });
    
    const teamRolesWithAccess = ['manager', 'creator', 'owner'];
    if (teamRole && teamRolesWithAccess.includes(teamRole)) {
      return createSuccessResponse({ 
        can_create: true, 
        reason: 'team_role',
        org_id: teamOrgId,
        role: teamRole
      });
    }
    
    // Get user's organization ID
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
    
    // If the user's org matches the team's org, they may have default access
    if (userProfile && userProfile.org_id === teamOrgId) {
      return createSuccessResponse({ 
        can_create: true, 
        reason: 'same_org',
        org_id: teamOrgId,
        role: 'member'
      });
    }
    
    // User does not have permission
    return createSuccessResponse({ 
      can_create: false, 
      reason: 'insufficient_permissions',
      org_id: teamOrgId
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
