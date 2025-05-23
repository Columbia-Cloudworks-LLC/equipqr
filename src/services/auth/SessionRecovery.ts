
import { supabase } from '@/integrations/supabase/client';
import { storageManager } from './StorageManager';

/**
 * SessionRecovery handles recovery operations for broken sessions
 */
export class SessionRecovery {
  /**
   * Attempt to repair and recover a broken session
   * @returns Promise<boolean> indicating if recovery succeeded
   */
  public async attemptSessionRecovery(): Promise<boolean> {
    console.log('SessionRecovery: Attempting session recovery');
    
    try {
      // First repair any storage inconsistencies
      const repaired = await storageManager.repairStorage();
      
      if (repaired) {
        console.log('SessionRecovery: Storage repaired, checking session again');
        
        // After repair, check if session is now valid
        const { data } = await supabase.auth.getSession();
        
        if (data?.session) {
          console.log('SessionRecovery: Session recovered successfully');
          return true;
        }
      }
      
      console.log('SessionRecovery: Session recovery failed');
      return false;
    } catch (error) {
      console.error('SessionRecovery: Error in session recovery:', error);
      return false;
    }
  }
}

// Create singleton instance
export const sessionRecovery = new SessionRecovery();
