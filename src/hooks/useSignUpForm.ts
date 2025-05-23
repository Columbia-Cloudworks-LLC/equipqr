
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useSignUpForm(
  initialEmail: string,
  onComplete: () => void
) {
  const [email, setEmail] = useState<string>(initialEmail);
  const [password, setPassword] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("");
  const [signUpComplete, setSignUpComplete] = useState<boolean>(false);
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

  return {
    email,
    setEmail,
    password,
    setPassword,
    displayName,
    setDisplayName,
    jobTitle,
    setJobTitle,
    organizationName,
    setOrganizationName,
    signUpComplete,
    handleSignUp
  };
}
