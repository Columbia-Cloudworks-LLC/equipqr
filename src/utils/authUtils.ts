
import { supabase } from "@/integrations/supabase/client";

/**
 * Convert auth.users ID to app_user ID
 */
export async function getAppUserId(authUserId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', authUserId)
      .maybeSingle();
    
    if (error) {
      console.error('Error getting app_user ID:', error);
      throw error;
    }
    
    if (!data || !data.id) {
      console.error('No app_user found for auth_uid:', authUserId);
      throw new Error('User profile not found');
    }
    
    return data.id;
  } catch (error) {
    console.error('Error in getAppUserId:', error);
    throw error;
  }
}

/**
 * Get user's organization ID
 */
export async function getUserOrganizationId(authUserId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', authUserId)
      .single();
    
    if (error) {
      console.error('Error getting user organization ID:', error);
      throw error;
    }
    
    if (!data || !data.org_id) {
      console.error('No organization found for user:', authUserId);
      throw new Error('User organization not found');
    }
    
    return data.org_id;
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
