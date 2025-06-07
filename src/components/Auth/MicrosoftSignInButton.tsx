
import { Button } from "@/components/ui/button";
import { microsoftOAuthHandler } from "@/services/auth/MicrosoftOAuthHandler";

interface MicrosoftSignInButtonProps {
  onClick: () => Promise<void>;
  isLoading: boolean;
}

export function MicrosoftSignInButton({ onClick, isLoading }: MicrosoftSignInButtonProps) {
  const handleClick = async () => {
    try {
      console.log('MicrosoftSignInButton: Starting Microsoft OAuth');
      await microsoftOAuthHandler.initiateOAuth();
    } catch (error) {
      console.error('MicrosoftSignInButton: Error:', error);
      // Error handling is done by the OAuth handler
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleClick}
      disabled={isLoading}
    >
      Sign in with Microsoft
    </Button>
  );
}
