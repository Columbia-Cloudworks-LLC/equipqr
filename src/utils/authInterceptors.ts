
// Compatibility layer for existing code
// This file re-exports the refactored auth utilities
import { authService } from '@/services/auth/AuthService';
import { sessionManager } from '@/services/auth/SessionManager';
import { storageManager } from '@/services/auth/StorageManager';

// Re-export deprecated functions for backward compatibility
export { resetAuthState, performFullAuthReset } from './auth/authReset';

// Re-export the new service functions to match old functionality
export const clearAllAuthStorageData = () => storageManager.clearAuthData();
export const clearAuthCookies = () => {}; // This is now handled internally by storageManager

// Session validation
export const validateSession = sessionManager.validateToken.bind(sessionManager);
export const getSessionInfo = sessionManager.getSessionInfo.bind(sessionManager);
export const repairSessionStorage = storageManager.repairStorage.bind(storageManager);
