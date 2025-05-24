
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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

    const { action, transferId, newOwnerId, reason } = await req.json();

    if (action === 'initiate') {
      // Initiate ownership transfer
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: 'User profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the app_user ID for the new owner
      const { data: newOwnerAppUser, error: newOwnerError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', newOwnerId)
        .single();

      if (newOwnerError || !newOwnerAppUser) {
        return new Response(
          JSON.stringify({ error: 'New owner not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the current user's app_user ID
      const { data: currentUserAppUser, error: currentUserError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', user.id)
        .single();

      if (currentUserError || !currentUserAppUser) {
        return new Response(
          JSON.stringify({ error: 'Current user app_user not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create the transfer record
      const { data: transfer, error: transferError } = await supabase
        .from('organization_transfers')
        .insert({
          org_id: profile.org_id,
          from_user_id: currentUserAppUser.id,
          to_user_id: newOwnerAppUser.id,
          initiated_by: currentUserAppUser.id,
          transfer_reason: reason || null
        })
        .select()
        .single();

      if (transferError) {
        console.error('Error creating transfer:', transferError);
        return new Response(
          JSON.stringify({ error: 'Failed to initiate transfer' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // TODO: Send email notification to new owner
      // This would integrate with Resend or similar service

      return new Response(
        JSON.stringify({ success: true, transfer }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'accept') {
      // Accept ownership transfer
      const { data: transfer, error: getTransferError } = await supabase
        .from('organization_transfers')
        .select('*')
        .eq('id', transferId)
        .eq('status', 'pending')
        .single();

      if (getTransferError || !transfer) {
        return new Response(
          JSON.stringify({ error: 'Transfer not found or already processed' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is the intended recipient
      const { data: userAppUser, error: userAppUserError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', user.id)
        .single();

      if (userAppUserError || !userAppUser || userAppUser.id !== transfer.to_user_id) {
        return new Response(
          JSON.stringify({ error: 'Not authorized to accept this transfer' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if transfer hasn't expired
      if (new Date(transfer.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Transfer has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update organization ownership
      const { error: updateOrgError } = await supabase
        .from('organization')
        .update({ owner_user_id: transfer.to_user_id })
        .eq('id', transfer.org_id);

      if (updateOrgError) {
        console.error('Error updating organization ownership:', updateOrgError);
        return new Response(
          JSON.stringify({ error: 'Failed to transfer ownership' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark transfer as accepted
      const { error: updateTransferError } = await supabase
        .from('organization_transfers')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', transferId);

      if (updateTransferError) {
        console.error('Error updating transfer status:', updateTransferError);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'reject') {
      // Reject ownership transfer
      const { error: rejectError } = await supabase
        .from('organization_transfers')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', transferId);

      if (rejectError) {
        console.error('Error rejecting transfer:', rejectError);
        return new Response(
          JSON.stringify({ error: 'Failed to reject transfer' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transfer_organization function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
