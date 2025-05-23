
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Define the CORS headers directly in this file
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
    console.log('Processing organization invitation acceptance request');
    
    // Extract authorization header - this contains the user's JWT token
    const authHeader = req.headers.get('Authorization');
    console.log(`Auth header present: ${!!authHeader}, length: ${authHeader?.length || 0}`);
    
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication required' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Create an admin client for operations that require bypassing RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Create a client with the user's auth token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });
    
    try {
      // Verify the token by making a simple authenticated request
      const { data: userResponse, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error verifying user token:', userError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid authentication token', 
            details: userError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      if (!userResponse.user) {
        console.error('No user found in token verification');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid user token'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      // Successfully authenticated user
      const currentUser = userResponse.user;
      console.log(`User authenticated: ${currentUser.id} (${currentUser.email})`);
      
      // Parse request body with error handling
      let requestData: RequestBody;
      try {
        requestData = await req.json();
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request format' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      const { token: invitationToken } = requestData;
      
      if (!invitationToken) {
        console.error('Missing token in request');
        return new Response(
          JSON.stringify({ success: false, error: 'Missing invitation token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Validate token format
      if (typeof invitationToken !== 'string' || invitationToken.length < 10) {
        console.error(`Invalid token format: ${typeof invitationToken}, length: ${invitationToken?.length}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid token format' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      console.log(`Processing organization invitation token: ${invitationToken.substring(0, 8)}... (length: ${invitationToken.length})`);
      
      // Fetch invitation details using admin client to bypass RLS
      // Check for both 'sent' and 'pending' statuses to handle any inconsistency
      const { data: invitationData, error: inviteQueryError } = await adminClient
        .from('organization_invitations')
        .select('*, organization:org_id(id, name)')
        .eq('token', invitationToken)
        .or('status.eq.sent,status.eq.pending')
        .maybeSingle();
        
      if (inviteQueryError) {
        console.error('Error querying invitation:', inviteQueryError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to fetch invitation details', 
            details: inviteQueryError.message 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      if (!invitationData) {
        console.error('No invitation found with token:', invitationToken.substring(0, 8));
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid or expired invitation token'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
      const invitation = invitationData;
      console.log(`Found invitation for ${invitation.email} to join ${invitation.organization?.name || 'unknown organization'}`);

      // Validate the invitation is for the current user
      if (currentUser.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        console.error(`Email mismatch: invitation for ${invitation.email}, but user is ${currentUser.email}`);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `This invitation was sent to ${invitation.email}. Please log in with that email to accept.` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      // Check if the invitation has expired
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        console.error('Invitation has expired:', invitation.expires_at);
        return new Response(
          JSON.stringify({ success: false, error: 'This invitation has expired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 410 }
        );
      }

      // Check if user is already a member of this organization
      const { data: existingRole, error: existingRoleError } = await adminClient
        .from('user_roles')
        .select('id, role')
        .eq('org_id', invitation.org_id)
        .eq('user_id', currentUser.id)
        .maybeSingle();
        
      if (existingRoleError && !existingRoleError.message.includes('No rows found')) {
        console.error('Error checking existing role:', existingRoleError);
      }
        
      if (existingRole) {
        console.log(`User is already a member of this organization with role: ${existingRole.role}`);
        
        // Update the invitation status even if already a member
        await adminClient
          .from('organization_invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('id', invitation.id);
          
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'You are already a member of this organization',
            data: {
              organization: invitation.organization,
              role: invitation.role
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      console.log('Adding user to organization with role:', invitation.role);
      
      try {
        // Begin a transaction to add the user to the organization
        // 1. Add the user to user_roles
        const { error: roleError } = await adminClient
          .from('user_roles')
          .insert({
            user_id: currentUser.id,
            org_id: invitation.org_id,
            role: invitation.role,
            assigned_by: invitation.created_by
          });

        if (roleError) {
          console.error('Error assigning role:', roleError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: `Failed to assign role: ${roleError.message}` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        // 2. Update user_profiles if they don't have an org_id set
        const { data: profile, error: profileError } = await adminClient
          .from('user_profiles')
          .select('org_id')
          .eq('id', currentUser.id)
          .single();
        
        if (profileError && !profileError.message.includes('No rows found')) {
          console.error('Error checking user profile:', profileError);
        }
        
        if (profile && !profile.org_id) {
          const { error: updateProfileError } = await adminClient
            .from('user_profiles')
            .update({ org_id: invitation.org_id })
            .eq('id', currentUser.id);
            
          if (updateProfileError) {
            console.error('Error updating user profile:', updateProfileError);
          }
        }

        // 3. Mark the invitation as accepted
        const { error: updateError } = await adminClient
          .from('organization_invitations')
          .update({ 
            status: 'accepted', 
            accepted_at: new Date().toISOString() 
          })
          .eq('id', invitation.id);
          
        if (updateError) {
          console.error('Error updating invitation status:', updateError);
          // Not critical as the user is already added to the organization
        }

        console.log('Successfully added user to organization');
        
        // Return success
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Welcome to ${invitation.organization?.name || 'your new organization'}!`,
            data: {
              organization: invitation.organization,
              role: invitation.role
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (transactionError: any) {
        console.error('Error in transaction:', transactionError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to process invitation: ${transactionError.message}` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    } catch (tokenError: any) {
      console.error('Error verifying auth token:', tokenError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error verifying authentication token', 
          details: tokenError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Error in accept_organization_invitation:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unexpected error occurred' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
