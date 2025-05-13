
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
      return createErrorResponse("Missing required parameters: team_id and user_id must be provided");
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(team_id)) {
      console.error(`Invalid UUID format for team_id: ${team_id}`);
      return createErrorResponse("Invalid team ID format");
    }
    
    // Create regular Supabase client - no admin bypass needed with our security definer functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Use RPC to check team access
    const { data: canAccess, error: accessError } = await supabase.rpc('can_access_team', {
      p_uid: user_id,
      p_team_id: team_id
    });
    
    if (accessError) {
      console.error('Error checking team access:', accessError);
      return createErrorResponse(accessError.message);
    }
    
    if (!canAccess) {
      return createSuccessResponse({
        is_member: false,
        access_reason: 'no_permission'
      });
    }
    
    // User has access, get additional details
    
    // Get team role if applicable
    const { data: roleData } = await supabase.rpc('get_team_role_safe', {
      _user_id: user_id,
      _team_id: team_id
    });
    
    // Get team information for display purposes
    const { data: teamData } = await supabase
      .from('team')
      .select('name, org_id')
      .eq('id', team_id)
      .single();
    
    let orgName = null;
    if (teamData) {
      // Get organization name
      const { data: orgData } = await supabase
        .from('organization')
        .select('name')
        .eq('id', teamData.org_id)
        .single();
        
      if (orgData) {
        orgName = orgData.name;
      }
    }
    
    // Check if user is in same org
    let hasOrgAccess = false;
    let hasCrossOrgAccess = false;
    
    if (teamData) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user_id)
        .single();
      
      if (userProfile && userProfile.org_id === teamData.org_id) {
        hasOrgAccess = true;
      } else {
        // Check if user is a team member with role
        if (roleData) {
          hasCrossOrgAccess = true;
        }
      }
    }
    
    // Get app_user.id for team_member join
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .maybeSingle();
    
    // Get team_member_id if exists
    let teamMemberId = null;
    if (appUser?.id) {
      const { data: teamMember } = await supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', team_id)
        .maybeSingle();
      
      teamMemberId = teamMember?.id || null;
    }
    
    return createSuccessResponse({
      is_member: true,
      has_org_access: hasOrgAccess,
      has_cross_org_access: hasCrossOrgAccess,
      team_member_id: teamMemberId,
      access_reason: roleData ? 'team_member' : (hasOrgAccess ? 'same_org' : 'cross_org_access'),
      role: roleData || null,
      team: teamData ? {
        name: teamData.name,
        org_id: teamData.org_id
      } : null,
      org_name: orgName
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
