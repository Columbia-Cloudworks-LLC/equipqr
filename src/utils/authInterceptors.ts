
import { supabase } from '@/integrations/supabase/client';

/**
 * Reset all authentication state
 * This cleans up all auth related storage and performs a clean logout
 */
export function resetAuthState(): void {
  console.log('Resetting auth state...');
  
  try {
    // Clear supabase storage
    localStorage.removeItem('supabase.auth.token');
    
    // Clear any session data
    clearAllAuthStorageData();
    
    console.log('Auth state reset completed');
  } catch (error) {
    console.error('Error resetting auth state:', error);
  }
}

/**
 * Clear all Supabase-related storage data in browser
 */
function clearAllAuthStorageData(): void {
  // Get Supabase project ref from URL
  const projectRef = getSupabaseProjectRef();
  
  if (!projectRef) {
    console.warn('Could not determine Supabase project ref');
    return;
  }
  
  // Clear all known Supabase auth storage keys
  const keysToRemove = [
    `sb-${projectRef}-auth-token`,
    `sb-${projectRef}-auth-token-code-verifier`,
    `supabase.auth.token`,
    `supabase.auth.refreshToken`,
    `sb-${projectRef}-provider-token`,
    `sb-${projectRef}-session`
  ];
  
  console.log(`Clearing ${keysToRemove.length} auth storage keys`);
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove storage key: ${key}`, e);
    }
  });
}

/**
 * Get the Supabase project ref from SUPABASE_URL environment variable or URL
 */
function getSupabaseProjectRef(): string | null {
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
