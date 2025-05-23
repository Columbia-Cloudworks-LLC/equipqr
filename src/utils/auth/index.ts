
// Re-export methods from our new unified auth service
export { authService } from '@/services/auth/AuthService';
export { sessionManager } from '@/services/auth/SessionManager';
export { storageManager } from '@/services/auth/StorageManager';
export { sessionValidator } from '@/services/auth/SessionValidator';
export { sessionRecovery } from '@/services/auth/SessionRecovery';
export { sessionUtils } from '@/services/auth/SessionUtils';

// For backward compatibility
export { resetAuthState, performFullAuthReset } from './authReset';
