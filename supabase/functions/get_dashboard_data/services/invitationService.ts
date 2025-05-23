
/**
 * Service for fetching user invitations
 */
interface InvitationResult {
  success: boolean;
  invitations: any[];
  error?: string;
}

/**
 * Fetch pending invitations for a specific user
 */
export async function fetchUserInvitations(supabase: any, userId: string): Promise<InvitationResult> {
  try {
    console.log(`Fetching invitations for user: ${userId}`);
    
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (userError || !user?.email) {
      return { 
        success: false, 
        invitations: [],
        error: "Could not find user email" 
      };
    }
    
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(*)')
      .eq('email', user.email)
      .eq('status', 'pending');
    
    if (error) {
      return { 
        success: false, 
        invitations: [],
        error: error.message || "Failed to fetch invitations"
      };
    }
    
    return { 
      success: true, 
      invitations: data || []
    };
  } catch (error) {
    console.error('Error in fetchUserInvitations:', error);
    return { 
      success: false, 
      invitations: [],
      error: error.message || 'Internal server error in invitations service'
    };
  }
}
