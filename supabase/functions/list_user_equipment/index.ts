
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createSuccessResponse, createErrorResponse, corsHeaders } from '../../_shared/cors.ts';
import { createAdminClient } from '../../_shared/adminClient.ts';
import { getUserEquipment } from './equipment-service.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Set a reasonable timeout for the function execution
    const timeout = setTimeout(() => {
      throw new Error('Function execution timed out');
    }, 8000); // 8 seconds max execution time
    
    try {
      const { user_id } = await req.json();
      
      if (!user_id) {
        return createErrorResponse("Missing required parameter: user_id");
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user_id)) {
        console.error(`Invalid UUID format for user_id: ${user_id}`);
        return createErrorResponse("Invalid user ID format");
      }

      // Get equipment data using the service function
      const equipmentData = await getUserEquipment(user_id);
      
      return createSuccessResponse(equipmentData);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('Unexpected error:', error instanceof Error ? error.message : error);
    return createErrorResponse(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
