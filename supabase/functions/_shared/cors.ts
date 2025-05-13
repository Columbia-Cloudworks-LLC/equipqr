
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

/**
 * Create a standardized error response
 * @param message Error message
 * @param status HTTP status code (default: 400)
 * @returns Response object with error details
 */
export function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ 
      error: message, 
      success: false
    }),
    { 
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}

/**
 * Create a standardized success response
 * @param data Response data
 * @param status HTTP status code (default: 200)
 * @returns Response object with data
 */
export function createSuccessResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify(data),
    { 
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}

/**
 * Handle CORS preflight requests
 * @returns Response for OPTIONS requests
 */
export function handleCorsPreflightRequest() {
  return new Response(null, { headers: corsHeaders });
}
