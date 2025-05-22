
import { supabase } from "@/integrations/supabase/client";

/**
 * Get user's app_user ID and organization ID
 * @param userId Auth user ID
 * @returns Object containing appUserId and userOrgId
 */
export async function getUserIdentifiers(userId: string): Promise<{ 
  appUserId: string | null; 
  userOrgId: string | null; 
}> {
  try {
    // Get the user's app_user ID
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
    
    if (appUserError) {
      console.error('Error getting app_user:', appUserError);
      return { appUserId: null, userOrgId: null };
    }
    
    const appUserId = appUser.id;
    
    // Get user's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error getting user profile:', profileError);
      return { appUserId, userOrgId: null };
    }
    
    return {
      appUserId,
      userOrgId: userProfile?.org_id || null
    };
  } catch (error) {
    console.error('Error getting user identifiers:', error);
    return { appUserId: null, userOrgId: null };
  }
}
