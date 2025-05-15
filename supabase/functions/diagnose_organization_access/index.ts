
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inlined from _shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function createSuccessResponse(data: any) {
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

// Inlined from _shared/organizationAccess.ts
async function validateOrganizationAccess(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  userId: string
) {
  try {
    // Create Supabase client with service role to bypass RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Check user profile
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .maybeSingle();
    
    const hasValidProfile = !!profile?.org_id;
    let orgId = profile?.org_id;
    
    // Check user roles
    const { data: roles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    const hasValidRoles = !!roles && roles.length > 0;
    
    // Check if user is an org owner
    const { data: appUser } = await adminClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .maybeSingle();
    
    let isOrgOwner = false;
    
    if (appUser?.id) {
      const { data: org } = await adminClient
        .from('organization')
        .select('*')
        .eq('owner_user_id', appUser.id)
        .maybeSingle();
      
      isOrgOwner = !!org;
      
      // If we didn't find org_id in profile but user is owner
      if (!orgId && org?.id) {
        orgId = org.id;
      }
    }
    
    // Compile issues
    const issues = [];
    
    if (!hasValidProfile) {
      issues.push('No valid user profile found or missing organization association');
    }
    
    if (!hasValidRoles && !isOrgOwner) {
      issues.push('User has no roles assigned in the organization');
    }
    
    // Return diagnostic information
    return {
      diagnostics: {
        orgId,
        appUserId: appUser?.id || null,
        hasValidProfile,
        hasValidRoles,
        isOrgOwner,
        issues
      },
      success: hasValidProfile || hasValidRoles || isOrgOwner,
      message: issues.length > 0 
        ? 'Organization access issues detected' 
        : 'Organization access validated successfully'
    };
  } catch (error) {
    console.error('Error in validateOrganizationAccess:', error);
    return {
      diagnostics: {
        issues: [`Internal error: ${error.message || 'Unknown error'}`]
      },
      success: false,
      message: 'Failed to validate organization access'
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      return createErrorResponse("Missing required parameter: user_id must be provided");
    }

    // Create Supabase admin client using environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Validate organization access
    const result = await validateOrganizationAccess(
      supabaseUrl,
      supabaseServiceRoleKey,
      user_id
    );
    
    return createSuccessResponse(result);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message || 'An unexpected error occurred');
  }
});
