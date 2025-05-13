import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, team_id, org_id } = await req.json();
    
    if (!user_id || (!team_id && !org_id)) {
      return createErrorResponse("Missing required parameters");
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Check org-level permission first if org_id is provided
    if (org_id) {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user_id)
        .eq('org_id', org_id)
        .limit(1);
        
      if (userRoles && userRoles.length > 0) {
        const role = userRoles[0].role;
        if (role === 'owner' || role === 'manager') {
          return createSuccessResponse({
            can_create: true,
            role: role,
            org_id: org_id,
            reason: 'org_role'
          });
        }
      }
    }
    
    // Check team-level permission if team_id is provided
    if (team_id) {
      const { data: role } = await supabase.rpc(
        'get_user_role_in_team',
        {
          p_user_uid: user_id,
          p_team_id: team_id
        }
      );
      
      const canCreate = role && ['owner', 'manager', 'admin', 'creator'].includes(role);
      
      if (canCreate) {
        // Get the team's org_id
        const { data: team } = await supabase
          .from('team')
          .select('org_id')
          .eq('id', team_id)
          .single();
          
        return createSuccessResponse({
          can_create: true,
          role: role,
          team_id: team_id,
          org_id: team?.org_id,
          reason: 'team_role'
        });
      }
    }
    
    // Default no permission
    return createSuccessResponse({
      can_create: false,
      reason: 'no_permission'
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
