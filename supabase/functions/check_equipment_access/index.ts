
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { equipment_id, user_id } = await req.json();
    
    if (!equipment_id || !user_id) {
      return createErrorResponse("Missing required parameters: equipment_id and user_id must be provided");
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(equipment_id)) {
      console.error(`Invalid UUID format for equipment_id: ${equipment_id}`);
      return createErrorResponse("Invalid equipment ID format");
    }
    
    // Create regular Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Use service role key to bypass RLS for consistent access checks
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Use direct query to check access instead of RPC to avoid type issues
    const { data: equipment } = await adminClient
      .from('equipment')
      .select(`
        id, 
        org_id,
        team_id
      `)
      .eq('id', equipment_id)
      .is('deleted_at', null)
      .single();
    
    if (!equipment) {
      return createSuccessResponse({
        has_access: false,
        reason: 'not_found'
      });
    }
    
    // Get user's organization
    const { data: userProfile } = await adminClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
    
    // Same organization check
    if (userProfile && userProfile.org_id === equipment.org_id) {
      // User can always access equipment from same organization
      const canEdit = true;  // Same org users can edit
      
      return createSuccessResponse({
        has_access: true,
        reason: 'same_organization',
        role: canEdit ? 'editor' : 'viewer',
        team_id: equipment.team_id
      });
    }
    
    // If not same org but has team_id, check team access
    if (equipment.team_id) {
      // Check if user is member of this team using reliable function
      const { data: hasTeamAccess, error: teamError } = await adminClient.rpc(
        'check_team_access_nonrecursive',
        {
          p_user_id: user_id,
          p_team_id: equipment.team_id
        }
      );
      
      if (teamError) {
        console.error('Error checking team access:', teamError);
        // Continue to next check rather than failing completely
      }
      
      if (hasTeamAccess) {
        // If team member, check if they have edit permission
        const { data: teamRole } = await adminClient.rpc(
          'get_team_role_safe',
          {
            _user_id: user_id,
            _team_id: equipment.team_id
          }
        );
        
        const canEdit = teamRole && ['manager', 'owner', 'admin', 'creator'].includes(teamRole);
        
        return createSuccessResponse({
          has_access: true,
          reason: 'team_membership',
          role: canEdit ? 'editor' : 'viewer',
          team_id: equipment.team_id
        });
      }
    }
    
    // No access found
    return createSuccessResponse({
      has_access: false,
      reason: 'no_permission'
    });
    
  } catch (error) {
    console.error('Unexpected error in check_equipment_access:', error);
    return createErrorResponse(error.message);
  }
});
