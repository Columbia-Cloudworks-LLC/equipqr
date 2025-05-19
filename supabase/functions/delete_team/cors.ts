
// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Helper for creating consistent success responses
export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    }
  );
}

// Helper for creating consistent error responses
export function createErrorResponse(message: string, status: number = 400) {
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
