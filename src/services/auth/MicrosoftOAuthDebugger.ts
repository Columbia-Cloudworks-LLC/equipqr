
import { toast } from 'sonner';

/**
 * Simplified Microsoft OAuth debugging service
 */
export class MicrosoftOAuthDebugger {
  /**
   * Log Microsoft OAuth attempt for basic debugging
   */
  public static logMicrosoftOAuthAttempt(details: {
    stage: 'initiate' | 'error';
    error?: string;
  }): void {
    const timestamp = new Date().toISOString();
    
    if (details.stage === 'initiate') {
      console.log(`Microsoft OAuth initiated at ${timestamp}`);
      console.log('Callback URL:', `${window.location.origin}/auth/callback`);
    }
    
    if (details.stage === 'error') {
      console.error(`Microsoft OAuth error at ${timestamp}:`, details.error);
    }
  }

  /**
   * Display basic Microsoft OAuth troubleshooting information
   */
  public static async showTroubleshootingToast(): Promise<void> {
    const currentUrl = window.location.origin;
    const callbackUrl = `${currentUrl}/auth/callback`;
    
    toast.info('Microsoft OAuth Troubleshooting', {
      description: 'Check the browser console for configuration details.',
      duration: 6000
    });
    
    console.group('🔧 Microsoft OAuth Configuration');
    console.log('Current origin:', currentUrl);
    console.log('Callback URL:', callbackUrl);
    console.log('Verify in Microsoft Entra ID:');
    console.log('1. Redirect URIs include:', callbackUrl);
    console.log('2. API permissions: email, openid, profile, User.Read');
    console.log('3. Permissions have admin consent');
    console.groupEnd();
  }
}
