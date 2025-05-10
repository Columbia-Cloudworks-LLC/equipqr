
import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the app_user.id associated with the current authenticated user
 * This is necessary because auth.uid() and app_user.id are different
 */
export async function getAppUserId(authUserId: string): Promise<string> {
  try {
    // Try to find the app_user record linked to this auth user
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', authUserId)
      .single();
    
    if (appUserError || !appUser) {
      console.error('Error finding app user:', appUserError);
      throw new Error('Failed to find your user profile. Please ensure your profile is set up correctly.');
    }
    
    return appUser.id;
  } catch (error) {
    console.error('Error in getAppUserId:', error);
    throw error;
  }
}

/**
 * Gets the organization ID for the current user
 */
export async function getUserOrganizationId(userId: string): Promise<string> {
  try {
    // Get the user profile to determine organization ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
      
    if (profileError || !userProfile?.org_id) {
      console.error('Error fetching user profile:', profileError);
      throw new Error('Failed to determine your organization. Please ensure your profile is set up correctly.');
    }
    
    return userProfile.org_id;
  } catch (error) {
    console.error('Error in getUserOrganizationId:', error);
    throw error;
  }
}

/**
 * Process input data to handle empty strings for date fields
 * @param data The data object to process
 * @param dateFields Array of field names to check for empty strings
 * @returns A new object with processed date fields
 */
export function processDateFields<T extends Record<string, any>>(data: T, dateFields: string[]): T {
  // Create a shallow copy of the input object
  const processed = { ...data } as T;
  
  // Process each date field
  dateFields.forEach(field => {
    if (field in processed) {
      const value = processed[field as keyof T];
      if (value === '' || value === undefined) {
        // Use type assertion to safely assign to the property
        (processed as Record<string, any>)[field] = null;
      }
    }
  });
  
  return processed;
}
