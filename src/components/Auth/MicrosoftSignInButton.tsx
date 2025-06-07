
import { Button } from "@/components/ui/button";
import { microsoftOAuthHandler } from "@/services/auth/MicrosoftOAuthHandler";

interface MicrosoftSignInButtonProps {
  onClick: () => Promise<void>;
  isLoading: boolean;
}

export function MicrosoftSignInButton({ onClick, isLoading }: MicrosoftSignInButtonProps) {
  const handleClick = async () => {
    try {
      console.log('Microsoft Sign-in: Button clicked');
      
      // Use the enhanced Microsoft OAuth handler instead
      await microsoftOAuthHandler.initiateOAuth();
    } catch (error) {
      console.error('Microsoft Sign-in: Button click error:', error);
      // Error handling is done by the OAuth handler
    }
  };

  // Double-click handler for troubleshooting info
  const handleDoubleClick = () => {
    const currentUrl = window.location.origin;
    const callbackUrl = `${currentUrl}/auth/callback`;
    
    console.group('🔧 Microsoft OAuth Troubleshooting');
    console.log('Current origin:', currentUrl);
    console.log('Callback URL:', callbackUrl);
    console.log('Verify in Microsoft Entra ID:');
    console.log('1. Redirect URIs include:', callbackUrl);
    console.log('2. API permissions: email, openid, profile, User.Read');
    console.log('3. Permissions have admin consent');
    console.log('4. Token configuration: Add email and profile optional claims');
    console.groupEnd();
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      disabled={isLoading}
      title="Double-click for troubleshooting info"
    >
      Sign in with Microsoft
    </Button>
  );
}
