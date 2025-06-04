
import { SUPABASE_CONFIG } from '@/config/environment';

/**
 * Get the Supabase project ref from configuration
 */
export function getSupabaseProjectRef(): string {
  return SUPABASE_CONFIG.projectRef;
}

/**
 * Re-export from main authUtils for backward compatibility
 */
export { processDateFields, getAppUserId } from '@/utils/authUtils';
