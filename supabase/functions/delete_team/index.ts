import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { TeamDeletionValidator } from './teamDeletionValidator.ts';
import { TeamDeletionService } from './teamDeletionService.ts';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Helper for creating consistent success responses
function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    }
  );
}

// Helper for creating consistent error responses
function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      message,
      error: message,
      code: message.includes('not found') ? 'TEAM_NOT_FOUND' : undefined
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status 
    }
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return createErrorResponse('Invalid request body', 400);
    }

    const { teamId, userId } = body;

    if (!teamId || !userId) {
      console.error('Missing required parameters:', { teamId, userId });
      return createErrorResponse('Missing required parameters: teamId and userId', 400);
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase URL or service role key');
      return createErrorResponse('Server configuration error', 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`Processing delete request for team: ${teamId} by user: ${userId}`);

    // Validate if the user has permission to delete the team
    const validator = new TeamDeletionValidator(supabase);
    const validationResult = await validator.validatePermission(userId, teamId);

    if (!validationResult.hasPermission) {
      console.error('Permission validation failed:', validationResult);
      return createErrorResponse(validationResult.message || 'Permission denied', 403);
    }

    console.log('Permission validation successful:', validationResult);

    // Delete the team and its related data
    const deletionService = new TeamDeletionService(supabase);
    const result = await deletionService.deleteTeam(teamId);

    console.log('Team deleted successfully with results:', result);

    return createSuccessResponse({
      success: true,
      message: 'Team deleted successfully',
      equipmentUpdated: result.equipmentUpdated,
      membersDeleted: result.membersDeleted,
      invitationsCancelled: result.invitationsCancelled,
      teamId
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Server error: ${error.message}`, 500);
  }
});
