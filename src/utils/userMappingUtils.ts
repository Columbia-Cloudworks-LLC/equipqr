
import { supabase } from '@/integrations/supabase/client';

/**
 * Maps auth.users.id to app_user.id
 * This is needed because equipment.created_by references app_user.id, not auth.users.id
 */
export async function getAppUserIdFromAuthId(authUserId: string): Promise<string | null> {
  try {
    console.log('Mapping auth user ID to app_user ID:', authUserId);
    
    const { data, error } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', authUserId)
      .single();
    
    if (error) {
      console.error('Error getting app_user ID:', error);
      return null;
    }
    
    if (!data) {
      console.error('No app_user record found for auth user:', authUserId);
      return null;
    }
    
    console.log('Successfully mapped to app_user ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Unexpected error in getAppUserIdFromAuthId:', error);
    return null;
  }
}

/**
 * Ensures an app_user record exists for the given auth user
 * Creates one if it doesn't exist
 */
export async function ensureAppUserExists(authUserId: string, email?: string, displayName?: string): Promise<string | null> {
  try {
    // First try to get existing app_user
    let appUserId = await getAppUserIdFromAuthId(authUserId);
    
    if (appUserId) {
      return appUserId;
    }
    
    // If no app_user exists, create one
    console.log('Creating new app_user record for auth user:', authUserId);
    
    const { data, error } = await supabase
      .from('app_user')
      .insert({
        auth_uid: authUserId,
        email: email || 'unknown@example.com',
        display_name: displayName || 'Unknown User'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating app_user record:', error);
      return null;
    }
    
    console.log('Successfully created app_user record:', data.id);
    return data.id;
  } catch (error) {
    console.error('Unexpected error in ensureAppUserExists:', error);
    return null;
  }
}
