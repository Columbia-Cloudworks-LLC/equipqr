
// CORS headers for Supabase Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Helper functions for creating consistent responses
export function createErrorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({
      error: message
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status
    }
  );
}

export function createSuccessResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status
    }
  );
}
