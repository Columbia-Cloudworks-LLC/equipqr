
import { Button } from "@/components/ui/button";

interface MicrosoftSignInButtonProps {
  onClick: () => Promise<void>;
  isLoading: boolean;
}

export function MicrosoftSignInButton({ onClick, isLoading }: MicrosoftSignInButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={isLoading}
    >
      Sign in with Microsoft
    </Button>
  );
}
