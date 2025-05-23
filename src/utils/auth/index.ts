
// Re-export methods from our new unified auth service
export { authService } from '@/services/auth/AuthService';
export { sessionManager } from '@/services/auth/SessionManager';
export { storageManager } from '@/services/auth/StorageManager';

// For backward compatibility
export { resetAuthState, performFullAuthReset } from './authReset';

