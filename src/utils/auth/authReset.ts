
/**
 * Reset auth state
 */
export function resetAuthState() {
  // Clear auth-related storage
  localStorage.removeItem('authReturnTo');
  sessionStorage.removeItem('invitationPath');
  sessionStorage.removeItem('authRedirectCount');
}

/**
 * Perform a full reset of the auth system including storage cleanup
 */
export function performFullAuthReset() {
  resetAuthState();
  
  // Clear all Supabase-related storage
  const projectRef = "oxeheowbfsshpyldlskb";
  const keys = [
    `sb-${projectRef}-auth-token`,
    `sb-${projectRef}-auth-token-code-verifier`,
    "supabase.auth.token"
  ];
  
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error(`Error clearing ${key}:`, e);
    }
  });
}
