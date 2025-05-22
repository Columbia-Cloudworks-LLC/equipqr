
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// This endpoint handles changing an organization member's role
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract params from request
    const { auth_user_id, org_id, target_user_id, new_role } = await req.json();
    
    if (!auth_user_id || !org_id || !target_user_id || !new_role) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required parameters' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Initialize Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Check permission using our new database function
    const { data: canManage, error: permError } = await supabaseAdmin.rpc(
      'can_manage_org_member_role',
      { 
        manager_id: auth_user_id,
        target_user_id: target_user_id,
        org_id: org_id
      }
    );
    
    if (permError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Permission check failed: ${permError.message}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!canManage) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'You do not have permission to change this user\'s role' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    
    // Get the current role record
    const { data: currentRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', target_user_id)
      .eq('org_id', org_id)
      .maybeSingle();
    
    if (roleError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Error fetching current role: ${roleError.message}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Update or insert the role
    let result;
    if (currentRole) {
      // Update existing role
      result = await supabaseAdmin
        .from('user_roles')
        .update({ 
          role: new_role,
          assigned_by: auth_user_id,
          assigned_at: new Date().toISOString()
        })
        .eq('id', currentRole.id)
        .select();
    } else {
      // Insert new role
      result = await supabaseAdmin
        .from('user_roles')
        .insert({ 
          user_id: target_user_id,
          org_id: org_id,
          role: new_role,
          assigned_by: auth_user_id
        })
        .select();
    }
    
    if (result.error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Error updating role: ${result.error.message}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Add audit log entry
    await supabaseAdmin
      .from('audit_log')
      .insert({
        org_id: org_id,
        actor_user_id: auth_user_id,
        entity_id: target_user_id,
        entity_type: 'user_role',
        action: 'update',
        after_json: { role: new_role }
      });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Role updated successfully',
        data: result.data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error processing role change:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Error: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
