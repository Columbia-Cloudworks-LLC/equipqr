
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/corsHeaders.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/responseHelpers.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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
    
    // Create regular Supabase client - no admin bypass needed with our security definer functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Use RPC calls to check access
    const { data: canAccess, error: accessError } = await supabase.rpc(
      'can_access_equipment',
      {
        p_uid: user_id,
        p_equipment_id: equipment_id
      }
    );
    
    if (accessError) {
      console.error('Error checking equipment access:', accessError);
      return createErrorResponse(accessError.message);
    }
    
    if (!canAccess) {
      return createSuccessResponse({
        has_access: false,
        reason: 'no_permission'
      });
    }
    
    // Check if user can edit the equipment
    const { data: canEdit, error: editError } = await supabase.rpc(
      'can_edit_equipment',
      {
        p_uid: user_id,
        p_equipment_id: equipment_id
      }
    );
    
    if (editError) {
      console.error('Error checking equipment edit permission:', editError);
      // Still allow view access even if edit check fails
    }
    
    // Get the equipment's team if available
    const { data: equipment } = await supabase
      .from('equipment')
      .select('team_id')
      .eq('id', equipment_id)
      .maybeSingle();
      
    return createSuccessResponse({
      has_access: true,
      reason: 'permission_granted',
      role: canEdit ? 'editor' : 'viewer',
      team_id: equipment?.team_id || null
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});
