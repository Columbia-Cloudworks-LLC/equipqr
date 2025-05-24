
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

    const { reason } = await req.json();

    // Get user's organization and profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id, is_deactivated')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.is_deactivated) {
      return new Response(
        JSON.stringify({ error: 'User is already deactivated' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is the only manager in their organization
    const { data: isOnlyManager, error: managerCheckError } = await supabase
      .rpc('is_only_manager_in_org', {
        p_user_id: user.id,
        p_org_id: profile.org_id
      });

    if (managerCheckError) {
      console.error('Error checking manager status:', managerCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to check organization status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deactivationDeadline = new Date();
    deactivationDeadline.setDate(deactivationDeadline.getDate() + 7); // 7-day grace period

    if (isOnlyManager) {
      // User is the only manager - soft delete the organization and all related data
      const { error: orgDeleteError } = await supabase
        .rpc('soft_delete_organization', { p_org_id: profile.org_id });

      if (orgDeleteError) {
        console.error('Error deleting organization:', orgDeleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete organization' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // User is not the only manager - freeze the organization for now
      const { error: freezeError } = await supabase
        .rpc('freeze_organization', { p_org_id: profile.org_id });

      if (freezeError) {
        console.error('Error freezing organization:', freezeError);
        return new Response(
          JSON.stringify({ error: 'Failed to freeze organization' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Deactivate the user
    const { error: deactivateError } = await supabase
      .from('user_profiles')
      .update({
        is_deactivated: true,
        deactivated_at: new Date().toISOString(),
        deactivation_reason: reason || null,
        reactivation_deadline: deactivationDeadline.toISOString()
      })
      .eq('id', user.id);

    if (deactivateError) {
      console.error('Error deactivating user:', deactivateError);
      return new Response(
        JSON.stringify({ error: 'Failed to deactivate user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        isOnlyManager,
        reactivationDeadline: deactivationDeadline.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in deactivate_user function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
