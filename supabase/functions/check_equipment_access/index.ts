
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
    
    // Create service role client (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Use direct query to fetch equipment details
    const { data: equipment, error: equipmentError } = await adminClient
      .from('equipment')
      .select(`
        id, 
        org_id,
        team_id
      `)
      .eq('id', equipment_id)
      .is('deleted_at', null)
      .single();
    
    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      return createErrorResponse(`Equipment fetch error: ${equipmentError.message}`);
    }
    
    if (!equipment) {
      return createSuccessResponse({
        has_access: false,
        reason: 'not_found'
      });
    }
    
    console.log(`Found equipment: ${JSON.stringify(equipment)}`);
    
    // Get user's organization
    const { data: userProfile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      // Continue checking other access methods
    }
    
    // Same organization check - immediate access
    if (userProfile && userProfile.org_id === equipment.org_id) {
      console.log(`User has same-org access: ${userProfile.org_id} = ${equipment.org_id}`);
      return createSuccessResponse({
        has_access: true,
        reason: 'same_organization',
        role: 'editor',
        team_id: equipment.team_id
      });
    }
    
    // If not same org but has team_id, check team access
    if (equipment.team_id) {
      // Use non-recursive check to avoid RLS issues
      const { data: hasTeamAccess, error: teamError } = await adminClient.rpc(
        'check_team_access_nonrecursive',
        {
          p_user_id: user_id,
          p_team_id: equipment.team_id
        }
      );
      
      if (teamError) {
        console.error('Error checking team access:', teamError);
        // Continue to next check
      }
      
      if (hasTeamAccess) {
        // Get team role to determine edit permissions
        const { data: teamRole } = await adminClient.rpc(
          'get_team_role_safe',
          {
            _user_id: user_id,
            _team_id: equipment.team_id
          }
        );
        
        const canEdit = teamRole && ['manager', 'owner', 'admin', 'creator'].includes(teamRole);
        console.log(`User has team access via team ${equipment.team_id} with role: ${teamRole}`);
        
        return createSuccessResponse({
          has_access: true,
          reason: 'team_membership',
          role: canEdit ? 'editor' : 'viewer',
          team_id: equipment.team_id
        });
      }
    }
    
    console.log('No access found for user');
    // No access found
    return createSuccessResponse({
      has_access: false,
      reason: 'no_permission'
    });
    
  } catch (error) {
    console.error('Unexpected error in check_equipment_access:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
