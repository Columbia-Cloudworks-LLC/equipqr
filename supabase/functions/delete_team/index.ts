
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inline the required functionality from _shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the service role key (admin privileges)
function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamId, userId } = await req.json();
    
    if (!teamId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Team ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createAdminClient();
    
    // Step 1: Check if user has permission to delete the team
    // User must be a team manager or the organization owner
    const { data: accessData, error: accessError } = await supabase.rpc('check_team_access_detailed', {
      user_id: userId,
      team_id: teamId
    });
    
    if (accessError || !accessData?.has_access) {
      console.error('Error checking team access:', accessError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'You do not have permission to delete this team' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    
    if (!accessData.is_org_owner && accessData.team_role !== 'manager') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Only team managers and organization owners can delete teams' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    
    // Begin a transaction to update equipment and then delete the team
    // Step 2: Update all equipment records assigned to this team
    const { data: equipmentUpdate, error: equipmentError } = await supabase
      .from('equipment')
      .update({ team_id: null })
      .eq('team_id', teamId)
      .is('deleted_at', null);
      
    if (equipmentError) {
      console.error('Error updating equipment records:', equipmentError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to update equipment records',
          error: equipmentError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Get the count of updated equipment records
    const { count: equipmentCount, error: countError } = await supabase
      .from('equipment')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .is('deleted_at', null);
      
    // Step 3: Soft delete all team_member records
    const { error: memberError } = await supabase
      .from('team_member')
      .delete()
      .eq('team_id', teamId);
      
    if (memberError) {
      console.error('Error removing team members:', memberError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to remove team members',
          error: memberError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Step 4: Delete all team_roles for this team
    const { error: rolesError } = await supabase
      .from('team_roles')
      .delete()
      .eq('team_id', teamId);
      
    if (rolesError) {
      console.error('Error removing team roles:', rolesError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to remove team roles',
          error: rolesError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Step 5: Cancel all pending invitations for this team
    const { error: inviteError } = await supabase
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('team_id', teamId)
      .eq('status', 'pending');
      
    if (inviteError) {
      console.error('Error cancelling team invitations:', inviteError);
      // Non-critical error, continue with deletion
    }
    
    // Step 6: Finally, delete the team
    const { error: teamError } = await supabase
      .from('team')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', teamId);
      
    if (teamError) {
      console.error('Error deleting team:', teamError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to delete team',
          error: teamError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Team deleted successfully',
        equipmentUpdated: equipmentCount || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Unexpected error in delete_team function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Server error: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
