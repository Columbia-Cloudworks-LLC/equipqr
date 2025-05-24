
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile and check deactivation status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id, is_deactivated, deactivated_at, reactivation_deadline')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.is_deactivated) {
      return new Response(
        JSON.stringify({ error: 'User is not deactivated' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if reactivation deadline has passed
    if (profile.reactivation_deadline && new Date(profile.reactivation_deadline) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Reactivation deadline has passed. Account cannot be restored.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check organization status
    const { data: organization, error: orgError } = await supabase
      .from('organization')
      .select('status, deleted_at')
      .eq('id', profile.org_id)
      .single();

    if (orgError || !organization) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (organization.deleted_at) {
      return new Response(
        JSON.stringify({ error: 'Organization has been permanently deleted and cannot be restored' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reactivate the organization if it's frozen
    if (organization.status === 'frozen') {
      const { error: reactivateOrgError } = await supabase
        .rpc('reactivate_organization', { p_org_id: profile.org_id });

      if (reactivateOrgError) {
        console.error('Error reactivating organization:', reactivateOrgError);
        return new Response(
          JSON.stringify({ error: 'Failed to reactivate organization' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Reactivate the user
    const { error: reactivateUserError } = await supabase
      .from('user_profiles')
      .update({
        is_deactivated: false,
        deactivated_at: null,
        deactivation_reason: null,
        reactivation_deadline: null
      })
      .eq('id', user.id);

    if (reactivateUserError) {
      console.error('Error reactivating user:', reactivateUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to reactivate user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reactivate_user function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
