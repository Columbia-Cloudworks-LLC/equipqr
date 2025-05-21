
import { supabase } from '@/integrations/supabase/client'; 
import { UserRole } from '@/types/supabase-enums';

/**
 * Create an invitation for an organization
 */
export async function createOrganizationInvitation(
  email: string,
  organizationId: string,
  role: UserRole = 'viewer'
) {
  try {
    // First check if the user is already in the organization
    const { data: existingUser, error: checkError } = await supabase
      .rpc('get_user_by_email_safe', { email_param: email });
      
    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Error checking user: ${checkError.message}`);
    }
    
    if (existingUser) {
      // Extract user ID correctly from the response - handle both array and single object response
      const userId = Array.isArray(existingUser) 
        ? existingUser[0]?.id 
        : existingUser?.id;
      
      // Check if user already has a role in this org
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('org_id', organizationId)
        .maybeSingle();
        
      if (existingRole) {
        return { 
          success: false,
          error: 'This user is already a member of this organization'
        };
      }
    }
    
    // Get current user for invited_by field
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('Authentication required');
    }
    
    // Generate token
    const token = generateToken(32);
    
    // Get current user's email from auth.users through rpc
    const { data: userEmailData } = await supabase.auth.getUser();
    const currentUserEmail = userEmailData?.user?.email || '';
    
    // Create the invitation
    const invitationData = {
      email: email.toLowerCase(),
      org_id: organizationId,
      token: token,
      role: role as "owner" | "manager" | "technician" | "viewer" | "member", // Cast to the correct type
      created_by: session.session.user.id,
      invited_by_email: currentUserEmail
    };
    
    const { data, error } = await supabase
      .from('organization_invitations')
      .insert(invitationData)
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to create invitation: ${error.message}`);
    }
    
    // Send email notification (handled by database triggers or edge function)
    const emailResult = await supabase.functions.invoke('send_organization_invitation_email', {
      body: { 
        invitation_id: data.id,
        email: email
      }
    });
    
    if (emailResult.error) {
      console.error('Error sending invitation email:', emailResult.error);
      // We don't throw here to still return success if the invitation was created
    }
    
    return {
      success: true,
      data: data
    };
  } catch (error: any) {
    console.error('Error creating organization invitation:', error);
    return {
      success: false,
      error: error.message || 'An error occurred creating invitation'
    };
  }
}

/**
 * Generate a random token for the invitation
 */
function generateToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}
