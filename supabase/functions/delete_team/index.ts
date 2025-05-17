
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

    console.log(`Processing delete request for team: ${teamId} by user: ${userId}`);
    const supabase = createAdminClient();
    
    // Step 1: Check if user has permission to delete the team
    // User must be a team manager or the organization owner
    const { data: accessData, error: accessError } = await supabase.rpc('check_team_access_detailed', {
      user_id: userId,
      team_id: teamId
    });
    
    console.log('Access data:', accessData);
    
    if (accessError) {
      console.error('Error checking team access:', accessError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error checking team access',
          error: accessError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!accessData?.has_access) {
      console.log('User has no access to this team');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'You do not have permission to delete this team' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    
    // Allow both org owners and team managers to delete the team
    if (!accessData.is_org_owner && accessData.team_role !== 'manager') {
      console.log(`User role is not sufficient: team_role=${accessData.team_role}, is_org_owner=${accessData.is_org_owner}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Only team managers and organization owners can delete teams' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    
    console.log('User has permission to delete the team');
    
    // Get the count of equipment records that will be affected
    const { count: equipmentCount, error: countError } = await supabase
      .from('equipment')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .is('deleted_at', null);
      
    if (countError) {
      console.error('Error getting equipment count:', countError);
      // Non-critical error, continue with deletion
    }
    
    console.log(`Found ${equipmentCount || 0} equipment records to update`);
    
    // Step 2: Update all equipment records assigned to this team
    const { error: equipmentError } = await supabase
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
    
    console.log('Equipment records updated successfully');
    
    // Step 3: Delete team_member records
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
    
    console.log('Team members removed successfully');
    
    // Step 4: Delete all team_roles for this team
    const { error: rolesError } = await supabase
      .from('team_roles')
      .delete()
      .eq('team_id', teamId);
      
    if (rolesError) {
      console.error('Error removing team roles:', rolesError);
      // We'll attempt to continue even if this fails as roles without members are orphaned anyway
      console.log('Continuing despite error removing team roles');
    } else {
      console.log('Team roles removed successfully');
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
      console.log('Continuing despite error cancelling invitations');
    } else {
      console.log('Team invitations cancelled successfully');
    }
    
    // Step 6: Finally, soft delete the team
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
    
    console.log('Team deleted successfully');
    
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
