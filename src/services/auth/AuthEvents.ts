
import { Session } from '@supabase/supabase-js';

// Define authentication event types
export type AuthEventType = 
  | 'SIGNED_IN' 
  | 'SIGNED_OUT' 
  | 'USER_UPDATED' 
  | 'TOKEN_REFRESHED' 
  | 'PASSWORD_RECOVERY'
  | 'ERROR';

// Define event listener type
export type AuthEventListener = (event: AuthEventType, session: Session | null) => void;

/**
 * Manages auth event listeners and notification
 */
export class AuthEventManager {
  private listeners: AuthEventListener[] = [];
  
  /**
   * Add an event listener
   */
  public addEventListener(listener: AuthEventListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of an auth event
   */
  public notifyListeners(event: AuthEventType, session: Session | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(event, session);
      } catch (error) {
        console.error('AuthEventManager: Error in event listener', error);
      }
    });
  }
  
  /**
   * Clean up all listeners
   */
  public clearListeners(): void {
    this.listeners = [];
  }
}

// Create singleton instance
export const authEventManager = new AuthEventManager();
