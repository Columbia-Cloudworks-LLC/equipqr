import { supabase } from "@/integrations/supabase/client";

/**
 * Process date fields to handle various formats
 */
export function processDateFields(data: any, dateFields: string[]): any {
  const processedData = { ...data };
  
  dateFields.forEach(field => {
    if (processedData[field]) {
      // If it's already an ISO string or date object, we're good
      if (processedData[field] instanceof Date) {
        processedData[field] = processedData[field].toISOString().split('T')[0];
      } else if (typeof processedData[field] === 'string') {
        // Make sure string dates are in YYYY-MM-DD format
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(processedData[field])) {
          try {
            // Parse the date and format it correctly
            const date = new Date(processedData[field]);
            processedData[field] = date.toISOString().split('T')[0];
          } catch (e) {
            console.error(`Error processing date field ${field}:`, e);
            // In case of error, null out the field to avoid DB errors
            processedData[field] = null;
          }
        }
      }
    }
  });
  
  return processedData;
}

/**
 * Get the current user's organization ID
 */
export async function getUserOrganizationId(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error getting user org ID:', error);
      return null;
    }
    
    return data?.org_id || null;
  } catch (error) {
    console.error('Error in getUserOrganizationId:', error);
    return null;
  }
}

/**
 * Convert an auth user ID to an app_user ID
 */
export async function getAppUserId(authUserId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', authUserId)
      .single();
      
    if (error) {
      console.error('Error getting app user ID:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error in getAppUserId:', error);
    return null;
  }
}

/**
 * Returns the list of authorized domains for the application
 */
export const getAuthorizedDomains = (): string[] => {
  return [
    "localhost",
    "127.0.0.1",
    "equipqr-staging.vercel.app",
    "equipqr.ai"
  ];
};

/**
 * Checks if the current hostname is an authorized domain
 */
export const isAuthorizedDomain = (hostname: string): boolean => {
  return getAuthorizedDomains().some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
};
