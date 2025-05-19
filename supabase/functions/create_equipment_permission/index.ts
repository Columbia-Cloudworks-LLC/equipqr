
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createSuccessResponse, createErrorResponse, corsHeaders } from '../_shared/cors.ts';
import { validateEquipmentPermissionPayload } from '../_shared/validation.ts';
import { tryPermissionCheck, initSupabaseClient } from './permissionCheck.ts';

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
