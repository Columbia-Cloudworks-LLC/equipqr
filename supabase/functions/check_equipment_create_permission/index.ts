
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
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Use service role key to bypass RLS - this avoids recursion issues
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
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
      // First get the app_user.id for this auth user
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', user_id)
        .single();
        
      if (!appUser) {
        return createSuccessResponse({
          can_create: false,
          reason: 'user_not_found'
        });
      }
      
      // Get team member record directly
      const { data: teamMember } = await supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', team_id)
        .single();
        
      if (!teamMember) {
        return createSuccessResponse({
          can_create: false,
          reason: 'not_team_member'
        });
      }
      
      // Get role from team_roles table
      const { data: teamRole } = await supabase
        .from('team_roles')
        .select('role')
        .eq('team_member_id', teamMember.id)
        .single();
        
      const role = teamRole?.role;
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
