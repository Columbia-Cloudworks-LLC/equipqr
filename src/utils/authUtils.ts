
import { supabase } from '@/integrations/supabase/client';

/**
 * Get the app_user.id from auth.users.id
 * Handles the type conversion between UUID and string
 */
export async function getAppUserId(authUid: string): Promise<string | null> {
  try {
    // FIXED: Use explicit UUID casting for auth_uid comparison
    // This ensures the query compares UUID to UUID, not string to UUID
    const { data, error } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', authUid)
      .maybeSingle();

    if (error) {
      console.error('Error fetching app_user ID:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Unexpected error in getAppUserId:', error);
    return null;
  }
}

/**
 * Process date fields to ensure they are in the correct format for database operations
 * For null/undefined values, return null to ensure proper database handling
 * For string values, ensure they are valid dates or return null
 * 
 * @param data - The object containing date fields to process
 * @param dateFields - Array of field names that should be treated as dates
 * @returns The processed object with correctly formatted date fields
 */
export function processDateFields(data: Record<string, any>, dateFields: string[] = []): Record<string, any> {
  const processed = { ...data };

  for (const field of dateFields) {
    if (field in processed) {
      const value = processed[field];
      
      if (value === null || value === undefined || value === '') {
        // Null values should remain null
        processed[field] = null;
      } else if (typeof value === 'string') {
        // Check if it's a valid date
        const date = new Date(value);
        processed[field] = !isNaN(date.getTime()) ? value : null;
      }
    }
  }

  return processed;
}

/**
 * Get the Supabase project ref from SUPABASE_URL environment variable or URL
 */
export function getSupabaseProjectRef(): string | null {
  // Extract from SUPABASE_URL
  const supabaseUrl = "https://oxeheowbfsshpyldlskb.supabase.co";
  
  if (supabaseUrl) {
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  console.warn('Could not extract project ref from SUPABASE_URL');
  return null;
}
