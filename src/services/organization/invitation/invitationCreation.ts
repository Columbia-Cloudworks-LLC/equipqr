
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
    const { data: existingUserResult, error: checkError } = await supabase
      .rpc('get_user_by_email_safe', { email_param: email });
      
    if (checkError) {
      // Only throw if it's not the "no rows returned" error (PGRST116)
      if (checkError.code !== 'PGRST116') {
        throw new Error(`Error checking user: ${checkError.message}`);
      }
      console.log("No existing user found with this email, proceeding with invitation");
    }
    
    // Handle the response consistently as an array
    let userId: string | undefined;
    
    if (existingUserResult) {
      // The get_user_by_email_safe function returns a table, which comes as an array
      if (Array.isArray(existingUserResult) && existingUserResult.length > 0) {
        userId = existingUserResult[0]?.id;
        console.log(`Found existing user with ID: ${userId}`);
      }
      
      // If we found a user, check if they already have a role in this org
      if (userId) {
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
    
    // Fetch organization name
    const { data: orgData, error: orgError } = await supabase
      .from('organization')
      .select('name')
      .eq('id', organizationId)
      .single();
      
    if (orgError || !orgData) {
      throw new Error(`Failed to fetch organization details: ${orgError?.message || 'Organization not found'}`);
    }
    
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
    
    // Send email notification with all required parameters
    const emailResult = await supabase.functions.invoke('send_organization_invitation_email', {
      body: { 
        email: email,
        organization_name: orgData.name,
        inviter_email: currentUserEmail,
        token: token,
        role: role
      }
    });
    
    if (emailResult.error) {
      console.error('Error sending invitation email:', emailResult.error);
      // Log detailed error information
      console.error('Email error details:', {
        params: {
          email,
          organizationName: orgData.name,
          inviterEmail: currentUserEmail,
          token: token.substring(0, 5) + '...',
          role
        },
        errorMsg: emailResult.error.message,
        errorName: emailResult.error.name,
        errorCode: (emailResult.error as any).code
      });
      
      // We don't throw here to still return success if the invitation was created
      return {
        success: true,
        data: data,
        warning: 'Invitation created but email delivery failed. You may need to resend the invitation.'
      };
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
