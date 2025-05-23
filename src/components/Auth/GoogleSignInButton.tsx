
import { Button } from "@/components/ui/button";

interface GoogleSignInButtonProps {
  onClick: () => Promise<void>;
  isLoading: boolean;
}

export function GoogleSignInButton({ onClick, isLoading }: GoogleSignInButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={isLoading}
    >
      Sign up with Google
    </Button>
  );
}
