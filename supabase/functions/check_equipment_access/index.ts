
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { 
  createAdminClient,
  checkEquipmentAccess,
  corsHeaders,
  createErrorResponse,
  createSuccessResponse
} from '../_shared/permissions.ts';

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
    
    // Create Supabase client
    const supabase = createAdminClient();
    
    // Check equipment access using the shared function
    const accessResult = await checkEquipmentAccess(supabase, user_id, equipment_id);
    
    // Get equipment team for the response (if applicable)
    let teamId = null;
    if (accessResult.details?.teamId) {
      teamId = accessResult.details.teamId;
    } else if (accessResult.hasAccess) {
      // Try to get team_id from the equipment
      const { data: equipment } = await supabase
        .from('equipment')
        .select('team_id')
        .eq('id', equipment_id)
        .maybeSingle();
        
      teamId = equipment?.team_id || null;
    }
    
    return createSuccessResponse({
      has_access: accessResult.hasAccess,
      reason: accessResult.reason,
      role: accessResult.role,
      team_id: teamId,
      details: accessResult.details
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
