
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Microsoft OAuth debugging and troubleshooting service
 */
export class MicrosoftOAuthDebugger {
  /**
   * Log detailed Microsoft OAuth debugging information
   */
  public static logMicrosoftOAuthAttempt(details: {
    stage: 'initiate' | 'callback' | 'error';
    data?: any;
    error?: string;
  }): void {
    const timestamp = new Date().toISOString();
    
    console.group(`🔍 Microsoft OAuth Debug - ${details.stage.toUpperCase()} - ${timestamp}`);
    
    if (details.stage === 'initiate') {
      console.log('📤 Initiating Microsoft OAuth flow');
      console.log('Current URL:', window.location.href);
      console.log('Callback URL configured:', `${window.location.origin}/auth/callback`);
      console.log('OAuth Parameters:', {
        provider: 'azure',
        prompt: 'consent',
        scope: 'openid email profile User.Read',
        response_type: 'code',
        response_mode: 'query'
      });
    }
    
    if (details.stage === 'callback' && details.data) {
      console.log('📥 Microsoft OAuth callback received');
      console.log('User ID:', details.data.user?.id);
      console.log('Email provided:', !!details.data.user?.email);
      console.log('Email value:', details.data.user?.email ? `${details.data.user.email.substring(0, 3)}***` : 'NONE');
      console.log('Email confirmed at:', details.data.user?.email_confirmed_at);
      console.log('Provider:', details.data.user?.app_metadata?.provider);
      console.log('Identities count:', details.data.user?.identities?.length || 0);
      
      if (details.data.user?.identities) {
        details.data.user.identities.forEach((identity: any, index: number) => {
          console.log(`Identity ${index + 1}:`, {
            provider: identity.provider,
            identity_id: identity.identity_id,
            has_identity_data: !!identity.identity_data,
            identity_data_keys: identity.identity_data ? Object.keys(identity.identity_data) : []
          });
        });
      }
      
      console.log('App metadata keys:', details.data.user?.app_metadata ? Object.keys(details.data.user.app_metadata) : []);
      console.log('User metadata keys:', details.data.user?.user_metadata ? Object.keys(details.data.user.user_metadata) : []);
    }
    
    if (details.stage === 'error') {
      console.error('❌ Microsoft OAuth error occurred');
      console.error('Error details:', details.error);
      console.error('Current URL:', window.location.href);
      
      // Check for common URL error parameters
      const urlParams = new URLSearchParams(window.location.search);
      const oauthError = urlParams.get('error');
      const oauthErrorDescription = urlParams.get('error_description');
      
      if (oauthError) {
        console.error('URL Error Parameters:', {
          error: oauthError,
          error_description: oauthErrorDescription
        });
      }
    }
    
    console.groupEnd();
  }

  /**
   * Check Microsoft OAuth configuration and provide recommendations
   */
  public static async checkMicrosoftOAuthConfig(): Promise<{
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // Check current URL configuration
      const currentUrl = window.location.origin;
      const callbackUrl = `${currentUrl}/auth/callback`;
      
      console.log('🔧 Checking Microsoft OAuth configuration...');
      console.log('Current origin:', currentUrl);
      console.log('Callback URL:', callbackUrl);
      
      // Check if we're on localhost (common development issue)
      if (currentUrl.includes('localhost')) {
        recommendations.push('You are on localhost. Ensure your Microsoft Entra ID app registration includes http://localhost:3000/auth/callback in the redirect URIs.');
      }
      
      // Check if we're on a secure origin
      if (!currentUrl.startsWith('https://') && !currentUrl.includes('localhost')) {
        issues.push('Microsoft OAuth requires HTTPS for production deployments.');
        recommendations.push('Ensure your site is served over HTTPS and update your Microsoft Entra ID redirect URIs accordingly.');
      }
      
      recommendations.push('Verify in Microsoft Entra ID that:');
      recommendations.push('1. Supported account types is set to "Accounts in any organizational directory and personal Microsoft accounts"');
      recommendations.push('2. API permissions include: email, openid, profile, User.Read');
      recommendations.push('3. API permissions are granted admin consent');
      recommendations.push('4. Token configuration includes "email" as an optional claim');
      recommendations.push('5. Redirect URIs include your callback URL: ' + callbackUrl);
      
    } catch (error) {
      console.error('Error checking Microsoft OAuth config:', error);
      issues.push('Could not check configuration due to an error.');
    }
    
    return { issues, recommendations };
  }

  /**
   * Display Microsoft OAuth troubleshooting information to user
   */
  public static async showTroubleshootingToast(): Promise<void> {
    const { issues, recommendations } = await this.checkMicrosoftOAuthConfig();
    
    if (issues.length > 0) {
      toast.error('Microsoft OAuth Configuration Issues', {
        description: issues.join(' '),
        duration: 10000
      });
    }
    
    toast.info('Microsoft OAuth Troubleshooting', {
      description: 'Check the browser console for detailed configuration recommendations.',
      duration: 8000
    });
    
    console.group('🔧 Microsoft OAuth Troubleshooting Recommendations');
    recommendations.forEach(rec => console.log(`💡 ${rec}`));
    console.groupEnd();
  }
}
