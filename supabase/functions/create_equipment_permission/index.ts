
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { tryPermissionCheck, initSupabaseClient } from './permissionCheck.ts';

// Inline the validation function instead of importing from _shared
function validateEquipmentPermissionPayload(userId: string, teamId?: string | null): string | null {
  // Check if user_id is present
  if (!userId) {
    return "Missing required parameter: user_id";
  }
  
  // Validate UUID format for user_id (simplified regex check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return "Invalid UUID format for user_id";
  }
  
  // If team_id is provided, validate it too (but it can be null/undefined)
  if (teamId && teamId !== 'none' && teamId !== 'null' && teamId !== '') {
    if (!uuidRegex.test(teamId)) {
      return "Invalid UUID format for team_id";
    }
  }
  
  // All checks passed
  return null;
}

// Inline the CORS headers and response functions instead of importing them
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Inline the success response function
function createSuccessResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status 
    }
  );
}

// Inline the error response function
function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }, 
      status 
    }
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.warn('No authorization header provided');
    } else {
      console.log('Authorization header is present');
    }

    // Log the raw request body for debugging
    const rawBody = await req.text();
    console.log(`Raw request body: ${rawBody}`);
    
    // Parse the request body
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log('Full incoming payload:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return createErrorResponse(`Invalid JSON in request body: ${parseError.message}`);
    }
    
    let { user_id, team_id } = body;
    
    // Log the exact types for debugging
    console.log(`Parameters received with types: user_id=${user_id} (${typeof user_id}), team_id=${team_id || 'null'} (${typeof team_id})`);
    
    // Validate the payload
    const validationError = validateEquipmentPermissionPayload(user_id, team_id);
    if (validationError) {
      console.error(validationError);
      return createErrorResponse(validationError);
    }
    
    // Normalize team_id
    if (team_id === 'null' || team_id === 'none' || team_id === '') {
      team_id = null;
      console.log('Normalized team_id to null');
    }
    
    // Initialize Supabase client
    const supabase = initSupabaseClient();
    
    // Try multiple permission check approaches
    try {
      const permissionData = await tryPermissionCheck(supabase, user_id, team_id);
      
      if (!permissionData) {
        console.error('Permission check returned no data');
        return createErrorResponse('Permission check failed: No data returned');
      }
      
      // Format the response consistently regardless of the method used
      const formattedResponse = {
        can_create: permissionData.has_permission || permissionData.can_create || false,
        org_id: permissionData.org_id,
        reason: permissionData.reason || 'unknown'
      };
      
      console.log('Final permission check result:', formattedResponse);
      return createSuccessResponse(formattedResponse);
      
    } catch (error) {
      console.error('All permission check attempts failed:', error);
      
      // Handle authorization errors specially
      if (authHeader === null || authHeader === undefined) {
        return createErrorResponse('Authentication required. Please sign in to continue.', 401);
      }
      
      // Provide a more specific error message based on the error
      if (error.message?.includes('operator does not exist')) {
        return createErrorResponse('Database type mismatch error. Please report this to support.', 500);
      }
      
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        return createErrorResponse('Required database function is missing. The system administrator has been notified.', 500);
      }
      
      if (error.message?.includes('type mismatch') || error.message?.includes('convert')) {
        return createErrorResponse('Data type conversion error. Please try again or contact support.', 500);
      }
      
      return createErrorResponse(`Permission check failed: ${error.message || 'Unknown error'}`, 500);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message || 'Unknown error', 500);
  }
});
