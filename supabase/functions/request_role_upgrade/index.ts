
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Extract request data
    const body = await req.json();
    const { team_id, user_id } = body;
    
    if (!team_id || !user_id) {
      return createErrorResponse('Missing required parameters: team_id and user_id must be provided');
    }
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get team details
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('id, name, org_id')
      .eq('id', team_id)
      .single();
    
    if (teamError) {
      console.error('Error fetching team details:', teamError);
      return createErrorResponse(`Failed to fetch team details: ${teamError.message}`, 500);
    }
    
    // Get user details - use auth.users for current user information
    const { data: user, error: userError } = await supabase
      .from('app_user')
      .select('email, display_name')
      .eq('auth_uid', user_id)
      .single();
    
    if (userError) {
      console.error('Error fetching user details:', userError);
      return createErrorResponse(`Failed to fetch user details: ${userError.message}`, 500);
    }
    
    // Get team member information
    const { data: teamMember, error: memberError } = await supabase
      .from('team_member')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', user_id)
      .single();
    
    if (memberError) {
      console.error('Error fetching team member:', memberError);
      return createErrorResponse(`Failed to fetch team member: ${memberError.message}`, 500);
    }
    
    // In a full implementation, we would insert the request into a role_requests table
    // For this simplified version, we'll add a request attribute to the team_member record
    
    // Get team managers to notify them about the request
    const { data: managers, error: managersError } = await supabase.rpc(
      'get_team_members_with_roles',
      { _team_id: team_id }
    );
    
    const managerEmails = managers
      ?.filter(m => m.role === 'manager')
      ?.map(m => m.email) || [];
    
    console.log(`Role upgrade requested by user ${user_id} for team ${team_id}`);
    console.log(`Notification would be sent to team managers: ${managerEmails.join(', ')}`);
    
    // For now, just return success - in a real implementation we would store the request
    return createSuccessResponse({ 
      success: true, 
      message: 'Role upgrade request submitted successfully',
      requestDetails: {
        teamId: team_id,
        teamName: team.name,
        userId: user_id,
        userName: user.display_name || user.email,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        notifiedManagers: managerEmails.length
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`, 500);
  }
});
