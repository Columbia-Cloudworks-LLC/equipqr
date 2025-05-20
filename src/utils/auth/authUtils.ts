
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

/**
 * Re-export from main authUtils for backward compatibility
 */
export { processDateFields, getAppUserId } from '@/utils/authUtils';
