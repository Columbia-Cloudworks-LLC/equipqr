import { supabase } from '@/integrations/supabase/client';
import { PermissionValidator } from '@/services/security/PermissionValidator';

/**
 * Utility functions for authentication operations
 */

/**
 * Process date fields in an object to ensure proper formatting
 * @param data - Object containing date fields
 * @param dateFields - Array of field names that should be processed as dates
 * @returns Processed object with properly formatted dates
 */
export function processDateFields(data: any, dateFields: string[]): any {
  if (!data || !dateFields || dateFields.length === 0) {
    return data;
  }

  const processedData = { ...data };
  
  dateFields.forEach(field => {
    if (processedData[field]) {
      // If it's already a valid ISO string, keep it
      if (typeof processedData[field] === 'string' && processedData[field].includes('T')) {
        return;
      }
      
      // Try to convert to ISO string
      try {
        const date = new Date(processedData[field]);
        if (!isNaN(date.getTime())) {
          processedData[field] = date.toISOString();
        }
      } catch (error) {
        console.warn(`Failed to process date field ${field}:`, error);
      }
    }
  });
  
  return processedData;
}

/**
 * Safely get app_user.id from auth.user.id
 * @param authUserId - The auth.users.id value
 * @returns Promise resolving to app_user.id if found, or null
 */
export async function getAppUserId(authUserId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', authUserId)
      .single();

    if (error) {
      console.error('Error getting app_user.id:', error);
      
      // Log security event for failed app user lookup
      await PermissionValidator.logSecurityEvent(
        'app_user_lookup_failed',
        'auth',
        authUserId,
        {
          error: error.message,
          timestamp: new Date().toISOString()
        },
        'warning'
      );
      
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Unexpected error getting app_user.id:', error);
    return null;
  }
}

/**
 * Get user's organization ID safely
 * @param authUserId - The auth.users.id value
 * @returns Promise resolving to organization ID if found, or null
 */
export async function getUserOrgId(authUserId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_org_id_safe', {
      user_id_param: authUserId
    });

    if (error) {
      console.error('Error getting user org ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error getting user org ID:', error);
    return null;
  }
}

/**
 * Check if user belongs to organization
 * @param authUserId - The auth.users.id value
 * @param orgId - The organization ID
 * @returns Promise resolving to boolean
 */
export async function userBelongsToOrg(authUserId: string, orgId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('user_belongs_to_org_safe', {
      user_id_param: authUserId,
      org_id_param: orgId
    });

    if (error) {
      console.error('Error checking org membership:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error checking org membership:', error);
    return false;
  }
}

/**
 * Check if user has specific role in organization
 * @param authUserId - The auth.users.id value
 * @param orgId - The organization ID
 * @param role - The role to check
 * @returns Promise resolving to boolean
 */
export async function userHasRole(authUserId: string, orgId: string, role: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('user_has_role_safe', {
      user_id_param: authUserId,
      org_id_param: orgId,
      role_param: role
    });

    if (error) {
      console.error('Error checking user role:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error checking user role:', error);
    return false;
  }
}

/**
 * Format user ID for logging (partial obfuscation for privacy)
 * @param userId - The user ID to format
 * @returns Partially obfuscated user ID
 */
export function formatUserIdForLogging(userId: string): string {
  if (!userId || userId.length < 8) {
    return 'INVALID_ID';
  }
  return `${userId.substring(0, 8)}...`;
}

/**
 * Validate UUID format
 * @param uuid - The UUID string to validate
 * @returns Boolean indicating if UUID is valid
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Get safe client identifier for rate limiting
 * @returns String identifier for rate limiting
 */
export function getClientIdentifier(): string {
  try {
    // Use a combination of factors for identification
    const userAgent = navigator.userAgent.substring(0, 50);
    const language = navigator.language;
    const platform = navigator.platform;
    
    // Create a simple hash-like identifier
    const identifier = btoa(`${userAgent}-${language}-${platform}`).substring(0, 32);
    return identifier;
  } catch (error) {
    console.error('Error generating client identifier:', error);
    return 'unknown_client';
  }
}
