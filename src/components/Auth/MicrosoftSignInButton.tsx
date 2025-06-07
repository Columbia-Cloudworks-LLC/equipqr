
import { Button } from "@/components/ui/button";
import { MicrosoftOAuthDebugger } from "@/services/auth/MicrosoftOAuthDebugger";

interface MicrosoftSignInButtonProps {
  onClick: () => Promise<void>;
  isLoading: boolean;
}

export function MicrosoftSignInButton({ onClick, isLoading }: MicrosoftSignInButtonProps) {
  const handleClick = async () => {
    try {
      // Log the OAuth initiation for debugging
      MicrosoftOAuthDebugger.logMicrosoftOAuthAttempt({
        stage: 'initiate'
      });
      
      await onClick();
    } catch (error) {
      // Log any errors during initiation
      MicrosoftOAuthDebugger.logMicrosoftOAuthAttempt({
        stage: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  // Double-click handler for troubleshooting info
  const handleDoubleClick = () => {
    MicrosoftOAuthDebugger.showTroubleshootingToast();
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
