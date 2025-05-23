
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface RequestBody {
  token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    console.log('Validating organization invitation token');
    
    // Extract authorization header - this contains the user's JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ valid: false, error: 'Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Create a client with the user's auth token for validation
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });
    
    // Create an admin client for operations that require bypassing RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Parse the request body to get the invitation token
    const requestData = await req.json();
    const { token } = requestData as RequestBody;
    
    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing invitation token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Validating organization invitation token: ${token.substring(0, 8)}...`);
    
    // Query the invitation - use admin client to bypass RLS
    const { data: invitation, error } = await adminClient
      .from('organization_invitations')
      .select('*, organization:org_id(name)')
      .eq('token', token)
      .or('status.eq.sent,status.eq.pending')
      .single();
    
    if (error) {
      console.error('Error fetching invitation:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Failed to validate invitation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!invitation) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid or expired invitation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Check if the invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: 'This invitation has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 410 }
      );
    }
    
    // Get the current user to check if the invitation is for them
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Error getting authenticated user:', userError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Authentication error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Check if invitation is for the current user
    if (userData.user.email && userData.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      console.warn(`Invitation email mismatch: ${invitation.email} vs ${userData.user.email}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `This invitation was sent to ${invitation.email}. Please log in with that email to accept.` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    
    // If we get here, the invitation is valid
    console.log('Invitation is valid:', invitation.id);
    
    return new Response(
      JSON.stringify({ valid: true, invitation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in validate_org_invitation:', error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
