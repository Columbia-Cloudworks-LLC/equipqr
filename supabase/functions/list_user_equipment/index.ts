
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/adminClient.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      return createErrorResponse("Missing required parameter: user_id");
    }

    const supabase = createAdminClient();
    
    // Get all equipment accessible to the user
    const { data: equipmentData, error } = await supabase
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .is('deleted_at', null)
      .order('name');
      
    if (error) {
      console.error('Error fetching equipment:', error);
      return createErrorResponse(`Failed to fetch equipment: ${error.message}`);
    }
    
    // Filter equipment based on user's access rights using our new helper functions
    const accessPromises = equipmentData.map(async (equipment) => {
      // Check if user can access this equipment item
      const { data: canAccess, error: accessError } = await supabase.rpc(
        'can_access_equipment',
        { p_uid: user_id, p_equipment_id: equipment.id }
      );
      
      if (accessError) {
        console.error(`Access check error for equipment ${equipment.id}:`, accessError);
        return null;
      }
      
      if (!canAccess) {
        return null;
      }
      
      // Check if user can edit this equipment item
      const { data: canEdit } = await supabase.rpc(
        'can_edit_equipment',
        { p_uid: user_id, p_equipment_id: equipment.id }
      );
      
      // Get user's org_id to determine if this is external
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user_id)
        .single();
      
      const isExternalOrg = equipment.team?.org_id && userProfile?.org_id && 
                          equipment.team.org_id !== userProfile.org_id;
      
      return {
        ...equipment,
        team_name: equipment.team?.name || null,
        org_name: equipment.org?.name || 'Unknown Organization',
        is_external_org: isExternalOrg,
        can_edit: !!canEdit
      };
    });
    
    const accessResults = await Promise.all(accessPromises);
    const accessibleEquipment = accessResults.filter(item => item !== null);
    
    // Return the filtered equipment list directly (not wrapped in a data object)
    return createSuccessResponse(accessibleEquipment);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
