
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { GoogleSignInButton } from "./GoogleSignInButton";

interface SignUpFormActionsProps {
  isLoading: boolean;
  handleGoogleSignIn: () => Promise<void>;
}

export function SignUpFormActions({ isLoading, handleGoogleSignIn }: SignUpFormActionsProps) {
  return (
    <CardFooter className="flex-col gap-4">
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>
      <div className="relative w-full">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-2">Or</span>
        </div>
      </div>
      <GoogleSignInButton onClick={handleGoogleSignIn} isLoading={isLoading} />
    </CardFooter>
  );
}
