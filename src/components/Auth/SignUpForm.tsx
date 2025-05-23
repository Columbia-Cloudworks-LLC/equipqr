
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { SignUpConfirmation } from "./SignUpConfirmation";

interface SignUpFormProps {
  email: string;
  setEmail: (email: string) => void;
  handleGoogleSignIn: () => Promise<void>;
  isLoading: boolean;
  onBackToLogin: () => void;
}

export function SignUpForm({ 
  email, 
  setEmail, 
  handleGoogleSignIn, 
  isLoading, 
  onBackToLogin 
}: SignUpFormProps) {
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [signUpComplete, setSignUpComplete] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Missing required fields", {
        description: "Please fill in all required fields"
      });
      return;
    }

    try {
      await signUp(email, password, {
        display_name: displayName || email.split("@")[0],
        job_title: jobTitle,
        organization_name: organizationName,
      });
      
      // Show the confirmation screen
      setSignUpComplete(true);
    } catch (error) {
      // Error is already handled in the auth context
    }
  };

  // If signup is complete, show the confirmation screen
  if (signUpComplete) {
    return <SignUpConfirmation email={email} onBackToLogin={onBackToLogin} />;
  }

  return (
    <form onSubmit={handleSignUp}>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email *</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="email@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password *</Label>
          <Input
            id="signup-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="display-name">Name</Label>
          <Input
            id="display-name"
            type="text"
            placeholder="Your Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-title">Job Title</Label>
          <Input
            id="job-title"
            type="text"
            placeholder="Your Job Title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organization-name">Organization Name</Label>
          <Input
            id="organization-name"
            type="text"
            placeholder="Your Organization"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
          />
        </div>
      </CardContent>
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
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          Sign up with Google
        </Button>
      </CardFooter>
    </form>
  );
}
