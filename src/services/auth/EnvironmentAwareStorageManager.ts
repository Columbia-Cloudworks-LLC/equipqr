
import { Session } from '@supabase/supabase-js';
import { getEnvironmentConfig, createEnvironmentStorageKey, detectCrossEnvironmentSession, cleanCrossEnvironmentSessions } from '@/config/environment';

/**
 * Environment-aware storage manager that prevents session mixing
 * between development and production environments
 */
export class EnvironmentAwareStorageManager {
  private projectRef: string = "oxeheowbfsshpyldlskb";
  private config = getEnvironmentConfig();
  
  constructor() {
    this.initializeEnvironmentSafety();
  }
  
  /**
   * Initialize environment safety checks and cleanup
   */
  private initializeEnvironmentSafety(): void {
    console.log(`StorageManager: Initializing for ${this.config.environment} environment`);
    
    // Check for cross-environment sessions
    if (detectCrossEnvironmentSession()) {
      console.warn('Cross-environment sessions detected, cleaning up...');
      cleanCrossEnvironmentSessions();
    }
  }
  
  /**
   * Get environment-specific session key
   */
  public getSessionKey(): string {
    return createEnvironmentStorageKey(`sb-${this.projectRef}-auth-token`);
  }
  
  /**
   * Get environment-specific legacy session key
   */
  public getLegacySessionKey(): string {
    return createEnvironmentStorageKey('supabase.auth.token');
  }
  
  /**
   * Get environment-specific code verifier key
   */
  public getCodeVerifierKey(): string {
    return createEnvironmentStorageKey(`sb-${this.projectRef}-auth-token-code-verifier`);
  }
  
  /**
   * Get an item from localStorage with environment isolation
   */
  public async getItem(key: string): Promise<string | null> {
    try {
      const envKey = this.isEnvironmentKey(key) ? key : createEnvironmentStorageKey(key);
      const value = localStorage.getItem(envKey);
      
      if (this.config.enableDebugLogs && value) {
        console.log(`Storage: Retrieved ${envKey} from ${this.config.environment}`);
      }
      
      return value;
    } catch (error) {
      console.error(`Error getting item from localStorage: ${key}`, error);
      return null;
    }
  }

  /**
   * Set an item in localStorage with environment isolation
   */
  public async setItem(key: string, value: string): Promise<void> {
    try {
      const envKey = this.isEnvironmentKey(key) ? key : createEnvironmentStorageKey(key);
      localStorage.setItem(envKey, value);
      
      if (this.config.enableDebugLogs) {
        console.log(`Storage: Stored ${envKey} in ${this.config.environment}`);
      }
    } catch (error) {
      console.error(`Error setting item in localStorage: ${key}`, error);
    }
  }

  /**
   * Remove an item from localStorage with environment isolation
   */
  public async removeItem(key: string): Promise<void> {
    try {
      const envKey = this.isEnvironmentKey(key) ? key : createEnvironmentStorageKey(key);
      localStorage.removeItem(envKey);
      
      if (this.config.enableDebugLogs) {
        console.log(`Storage: Removed ${envKey} from ${this.config.environment}`);
      }
    } catch (error) {
      console.error(`Error removing item from localStorage: ${key}`, error);
    }
  }

  /**
   * Check if a key is already environment-specific
   */
  private isEnvironmentKey(key: string): boolean {
    return key.startsWith(this.config.storagePrefix);
  }

  /**
   * Clear all auth-related data for current environment
   */
  public async clearAuthData(): Promise<void> {
    try {
      console.log(`StorageManager: Clearing auth data for ${this.config.environment}`);
      
      // Remove environment-specific session tokens
      await this.removeItem(this.getSessionKey());
      await this.removeItem(this.getLegacySessionKey());
      await this.removeItem(this.getCodeVerifierKey());
      
      // Clear any invitation data for current environment
      const invitationKey = createEnvironmentStorageKey('invitationPath');
      const invitationTypeKey = createEnvironmentStorageKey('invitationType');
      sessionStorage.removeItem(invitationKey);
      sessionStorage.removeItem(invitationTypeKey);
      
      console.log(`StorageManager: Auth data cleared for ${this.config.environment}`);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Repair storage inconsistencies for current environment
   */
  public async repairStorage(): Promise<boolean> {
    try {
      console.log(`StorageManager: Attempting to repair session storage for ${this.config.environment}`);
      let repaired = false;
      
      // Check for session in current environment storage
      const sessionKey = this.getSessionKey();
      const sessionData = await this.getItem(sessionKey);
      
      if (sessionData) {
        try {
          // Validate JSON and session structure
          const session = JSON.parse(sessionData);
          if (session?.access_token && session?.refresh_token) {
            console.log(`StorageManager: Found valid session in ${this.config.environment} environment`);
            repaired = true;
          }
        } catch (e) {
          console.error(`StorageManager: Found corrupt session in ${this.config.environment}:`, e);
          
          // Reset corrupted session
          await this.removeItem(sessionKey);
          repaired = false;
        }
      } else {
        // Check legacy storage for current environment
        const legacyKey = this.getLegacySessionKey();
        const legacyData = await this.getItem(legacyKey);
        
        if (legacyData) {
          try {
            // Attempt to migrate legacy session format
            const session = JSON.parse(legacyData);
            if (session?.access_token && session?.refresh_token) {
              console.log(`StorageManager: Migrating legacy session in ${this.config.environment}`);
              await this.setItem(sessionKey, legacyData);
              repaired = true;
            }
          } catch (e) {
            console.error(`StorageManager: Legacy session is corrupt in ${this.config.environment}:`, e);
          }
        }
      }
      
      return repaired;
    } catch (error) {
      console.error('StorageManager: Error repairing storage:', error);
      return false;
    }
  }
  
  /**
   * Get environment information for debugging
   */
  public getEnvironmentInfo(): Record<string, any> {
    return {
      environment: this.config.environment,
      storagePrefix: this.config.storagePrefix,
      sessionKey: this.getSessionKey(),
      legacySessionKey: this.getLegacySessionKey(),
      codeVerifierKey: this.getCodeVerifierKey(),
      debugLogsEnabled: this.config.enableDebugLogs
    };
  }
}

// Create singleton instance
export const environmentAwareStorageManager = new EnvironmentAwareStorageManager();
