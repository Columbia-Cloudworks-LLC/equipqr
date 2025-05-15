
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inline cors headers from _shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions previously from _shared/cors.ts
function createErrorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

function createSuccessResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Helper function previously from _shared/adminClient.ts
function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables for Supabase client');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitation_id, requester_id } = await req.json();
    
    if (!invitation_id) {
      return createErrorResponse("Missing required parameter: invitation_id");
    }
    
    if (!requester_id) {
      return createErrorResponse("Missing required parameter: requester_id");
    }

    // Create admin client to bypass RLS
    const supabase = createAdminClient();
    
    // First check if the invitation exists and is still valid
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select('id, email, team_id, status, expires_at')
      .eq('id', invitation_id)
      .single();
      
    if (invitationError) {
      console.error('Error fetching invitation:', invitationError);
      return createErrorResponse(`Failed to find invitation: ${invitationError.message}`);
    }
    
    if (!invitation) {
      return createErrorResponse("Invitation not found");
    }
    
    if (invitation.status !== 'pending') {
      return createErrorResponse(`Cannot resend invitation with status: ${invitation.status}`);
    }
    
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return createErrorResponse("Invitation has expired");
    }
    
    // Check if requester has permission to resend this invitation
    const { data: teamAccess } = await supabase.rpc('check_team_access_detailed', {
      user_id: requester_id,
      team_id: invitation.team_id
    });
    
    if (!teamAccess || !teamAccess.has_access || 
        (!teamAccess.is_org_owner && teamAccess.team_role !== 'manager')) {
      return createErrorResponse("You don't have permission to resend invitations for this team");
    }
    
    // Get requester's email for the email template
    const { data: requesterProfile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', requester_id)
      .single();
    
    const requesterName = requesterProfile?.display_name || 'A team manager';
    
    // Get team name
    const { data: team } = await supabase
      .from('team')
      .select('name, org_id')
      .eq('id', invitation.team_id)
      .single();
    
    if (!team) {
      return createErrorResponse("Team not found");
    }
    
    // Get org name
    const { data: org } = await supabase
      .from('organization')
      .select('name')
      .eq('id', team.org_id)
      .single();
    
    // Update the invitation expires_at to extend it 7 more days
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation_id);
    
    if (updateError) {
      console.error('Error updating invitation expiry:', updateError);
      return createErrorResponse(`Failed to update invitation: ${updateError.message}`);
    }
    
    // Now send the email via the send_invitation_email function
    const { error: emailError } = await supabase.functions.invoke('send_invitation_email', {
      body: {
        invitation_id: invitation.id,
        team_name: team.name,
        org_name: org?.name || 'Organization',
        requester_name: requesterName
      }
    });
    
    if (emailError) {
      console.error('Error sending invitation email:', emailError);
      return createErrorResponse(`Invitation updated but email failed to send: ${emailError.message}`);
    }
    
    return createSuccessResponse({
      success: true,
      message: `Invitation to ${invitation.email} has been resent successfully`
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
