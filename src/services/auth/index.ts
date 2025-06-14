

// Re-export methods from our new unified auth service
export { authService } from '@/services/auth/AuthService';
export { sessionManager } from '@/services/auth/SessionManager';
export { storageManager } from '@/services/auth/StorageManager';
export { sessionValidator } from '@/services/auth/SessionValidator';
export { sessionRecovery } from '@/services/auth/SessionRecovery';
export { sessionUtils } from '@/services/auth/SessionUtils';
export { microsoftOAuthHandler } from '@/services/auth/MicrosoftOAuthHandler';
export { DatabaseFunctions } from '@/services/auth/DatabaseFunctions';

// For backward compatibility
export { resetAuthState, performFullAuthReset } from './authReset';

/**
 * Initialize authentication services
 */
export async function initializeAuthServices(): Promise<void> {
  try {
    // Import DatabaseFunctions to use it
    const { DatabaseFunctions } = await import('@/services/auth/DatabaseFunctions');
    
    // Ensure database functions are available
    await DatabaseFunctions.ensureDuplicateEmailFunction();
    console.log('Authentication services initialized successfully');
  } catch (error) {
    console.error('Error initializing authentication services:', error);
  }
}

/**
 * Safely get app_user.id from auth.user.id
 * Provides a consistent interface for auth to app_user mapping
 * 
 * @param authUserId - The auth.users.id value
 * @returns Promise resolving to app_user.id if found, or null
 */
export async function safeGetAppUserId(authUserId: string): Promise<string | null> {
  // Import from authUtils to avoid circular dependencies
  const { getAppUserId } = await import('@/utils/authUtils');
  return getAppUserId(authUserId);
}

