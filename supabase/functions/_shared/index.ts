
// This file is now just a placeholder as we've inlined all shared code
// into individual functions to prevent import issues
// 
// The functions below are provided for backward compatibility in case
// any existing code still imports from this file

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200 
    }
  );
}

export function createErrorResponse(message: string, status: number = 400) {
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

// The functions below are placeholders and should not be used
// They're only here for backward compatibility
export const validateTeamAccess = () => {
  console.warn('This function is deprecated - use inline implementation instead');
};

export const validateOrganizationAccess = () => {
  console.warn('This function is deprecated - use inline implementation instead');
};

export const validateEquipmentAccess = () => {
  console.warn('This function is deprecated - use inline implementation instead');
};

export const createAdminClient = () => {
  console.warn('This function is deprecated - use inline implementation instead');
  return null;
};
