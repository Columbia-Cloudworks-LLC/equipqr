
import { authService } from '@/services/auth/AuthService';

/**
 * Reset all authentication state
 * @deprecated Use authService.resetAuthSystem() instead
 */
export function resetAuthState(): void {
  console.warn('resetAuthState is deprecated, use authService.resetAuthSystem() instead');
  authService.resetAuthSystem();
}

/**
 * Perform a comprehensive auth system reset and cleanup
 * @deprecated Use authService.resetAuthSystem() instead
 */
export function performFullAuthReset(): void {
  console.warn('performFullAuthReset is deprecated, use authService.resetAuthSystem() instead');
  authService.resetAuthSystem();
}
