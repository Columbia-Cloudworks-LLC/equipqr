
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link, Mail } from 'lucide-react';

interface AccountLinkingAlertProps {
  existingProviders: string[];
  newProvider: string;
  email: string;
  onProceedToSignIn: () => void;
}

export function AccountLinkingAlert({ 
  existingProviders, 
  newProvider, 
  email, 
  onProceedToSignIn 
}: AccountLinkingAlertProps) {
  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <Link className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="space-y-3">
          <p className="font-medium">Account Already Exists</p>
          <p className="text-sm">
            We found an existing account for <strong>{email}</strong> using{' '}
            {existingProviders.length > 1 
              ? `multiple providers (${existingProviders.join(', ')})` 
              : existingProviders[0]
            }.
          </p>
          <p className="text-sm">
            You can either sign in with your existing credentials, or we can link your {newProvider} account to your existing account.
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onProceedToSignIn}
              className="bg-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              Sign In Instead
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
