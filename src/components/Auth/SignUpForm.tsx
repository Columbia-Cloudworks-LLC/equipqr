
import { CardContent } from "@/components/ui/card";
import { SignUpConfirmation } from "./SignUpConfirmation";
import { SignUpFormFields } from "./SignUpFormFields";
import { SignUpFormActions } from "./SignUpFormActions";
import { useSignUpForm } from "@/hooks/useSignUpForm";

interface SignUpFormProps {
  email: string;
  setEmail: (email: string) => void;
  handleGoogleSignIn: () => Promise<void>;
  handleMicrosoftSignIn: () => Promise<void>;
  isLoading: boolean;
  onBackToLogin: () => void;
}

export function SignUpForm({ 
  email: initialEmail, 
  setEmail, 
  handleGoogleSignIn,
  handleMicrosoftSignIn,
  isLoading, 
  onBackToLogin 
}: SignUpFormProps) {
  const {
    email,
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
  } = useSignUpForm(initialEmail, onBackToLogin);

  // If signup is complete, show the confirmation screen
  if (signUpComplete) {
    return <SignUpConfirmation email={email} onBackToLogin={onBackToLogin} />;
  }

  return (
    <form onSubmit={handleSignUp}>
      <CardContent className="space-y-4 pt-4">
        <SignUpFormFields
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          displayName={displayName}
          setDisplayName={setDisplayName}
          jobTitle={jobTitle}
          setJobTitle={setJobTitle}
          organizationName={organizationName}
          setOrganizationName={setOrganizationName}
        />
      </CardContent>
      <SignUpFormActions
        isLoading={isLoading}
        handleGoogleSignIn={handleGoogleSignIn}
        handleMicrosoftSignIn={handleMicrosoftSignIn}
      />
    </form>
  );
}
