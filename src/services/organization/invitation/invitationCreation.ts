
import { supabase } from '@/integrations/supabase/client';
import { generateUniqueToken } from '@/lib/crypto';

/**
 * Invites a new user to join an organization with the specified role
 */
export async function inviteToOrganization(email, role, orgId) {
  try {
    if (!email || !role || !orgId) {
      throw new Error('Email, role, and organization ID are required');
    }
    
    // Check user session
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;
    
    if (!currentUserId) {
      throw new Error('Authentication required');
    }
    
    // Check if user is already part of the organization
    // Use a custom function directly instead of an RPC call
    const { data: userCheck, error: userCheckError } = await supabase.from('user_roles')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', (subquery) => 
        subquery.from('user_profiles').select('id').eq('email', email)
      );
      
    if (userCheckError) {
      throw new Error(`Failed to check user: ${userCheckError.message}`);
    }
    
    if (userCheck && userCheck.length > 0) {
      throw new Error('User is already a member of this organization');
    }
    
    // Check for pending invitations
    const { data: pendingInvites, error: inviteCheckError } = await supabase
      .from('organization_invitations')
      .select('id')
      .eq('email', email)
      .eq('org_id', orgId)
      .eq('status', 'pending');
      
    if (inviteCheckError) {
      throw new Error(`Failed to check invitations: ${inviteCheckError.message}`);
    }
    
    if (pendingInvites && pendingInvites.length > 0) {
      throw new Error('This user already has a pending invitation');
    }
    
    // Get current user email for the invitation details
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .eq('id', currentUserId)
      .single();
      
    // Generate a unique token for the invitation
    const token = await generateUniqueToken();
    
    // Use type assertion to fix the role type issue
    const { data: invitation, error: createError } = await supabase
      .from('organization_invitations')
      .insert({
        email,
        role: role,
        org_id: orgId,
        token,
        created_by: currentUserId,
        invited_by_email: sessionData?.session?.user?.email
      })
      .select('id, email, role, token')
      .single();
      
    if (createError) {
      throw new Error(`Failed to create invitation: ${createError.message}`);
    }
    
    // Trigger an email notification using edge function
    const { error: emailError } = await supabase.functions.invoke('send_invitation_email', {
      body: {
        invitation_id: invitation.id,
        type: 'organization'
      }
    });
    
    if (emailError) {
      console.error('Warning: Failed to send invitation email', emailError);
      // We don't throw here because the invitation was created successfully
    }
    
    return {
      success: true,
      invitation
    };
  } catch (error) {
    console.error('Error inviting to organization:', error);
    return {
      success: false,
      error: error.message || 'Failed to create invitation'
    };
  }
}
