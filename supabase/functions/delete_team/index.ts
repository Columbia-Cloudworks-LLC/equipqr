
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/index.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface RequestBody {
  teamId: string;
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    });
    
    // Parse request body
    const { teamId, userId } = await req.json() as RequestBody;
    
    if (!teamId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: teamId and userId' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    console.log(`Delete team request for teamId: ${teamId} by userId: ${userId}`);
    
    // 1. Get team details to check ownership
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('*, organization:org_id(id, name)')
      .eq('id', teamId)
      .is('deleted_at', null)
      .single();
    
    if (teamError || !team) {
      console.error('Error fetching team:', teamError);
      return new Response(
        JSON.stringify({ error: teamError?.message || 'Team not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404
        }
      );
    }
    
    // 2. Check if user is authorized to delete the team
    // First get the app_user.id from auth.users.id
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
      
    if (!appUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }
    
    // Check if user is the team creator/manager
    const { data: teamRole } = await supabase
      .from('team_roles')
      .select('role')
      .eq('team_member_id', (q) => 
        q.select('id')
          .from('team_member')
          .eq('team_id', teamId)
          .eq('user_id', appUser.id)
          .single()
      )
      .single();
    
    // Also check org-level permissions
    const { data: orgRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', team.org_id)
      .single();
    
    const userRole = teamRole?.role || orgRole?.role;
    const canDelete = ['manager', 'owner', 'admin', 'creator'].includes(userRole || '');
    
    if (!canDelete) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You do not have permission to delete this team' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }
    
    // Begin transaction to:
    // 1. Unassign equipment from the team
    // 2. Mark the team as deleted
    
    // Start with equipment reassignment
    const { data: updatedEquipment, error: equipmentError } = await supabase
      .from('equipment')
      .update({ team_id: null, updated_at: new Date().toISOString() })
      .eq('team_id', teamId)
      .select('id');
    
    if (equipmentError) {
      console.error('Error updating equipment:', equipmentError);
      return new Response(
        JSON.stringify({ error: 'Failed to update equipment: ' + equipmentError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    // Then mark the team as deleted (soft delete)
    const { error: deleteError } = await supabase
      .from('team')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', teamId);
    
    if (deleteError) {
      console.error('Error deleting team:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete team: ' + deleteError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    // Return success with details on equipment affected
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Team deleted successfully',
        equipmentUpdated: updatedEquipment?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
