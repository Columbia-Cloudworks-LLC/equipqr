
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { MailCheck } from "lucide-react";

interface SignUpConfirmationProps {
  email: string;
  onBackToLogin: () => void;
}

export function SignUpConfirmation({ email, onBackToLogin }: SignUpConfirmationProps) {
  return (
    <div>
      <CardContent className="space-y-6 pt-4 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <MailCheck className="h-12 w-12" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Check your email</h3>
          <p className="text-muted-foreground">
            We've sent a verification link to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <p>Please check your inbox and click the verification link to complete your account setup.</p>
          <p className="mt-2">If you don't see the email, check your spam folder.</p>
        </div>
      </CardContent>
      
      <CardFooter className="flex-col">
        <Button 
          variant="outline" 
          onClick={onBackToLogin} 
          className="w-full"
        >
          Back to Login
        </Button>
      </CardFooter>
    </div>
  );
}
