
import { createAdminClient } from "../adminClient.ts";

/**
 * Gets the app_user ID for an auth user
 */
export async function getAppUserId(authUserId: string): Promise<string | null> {
  try {
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', authUserId)
      .single();
    
    if (error) {
      console.error('Error getting app_user ID:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error in getAppUserId:', error);
    return null;
  }
}
