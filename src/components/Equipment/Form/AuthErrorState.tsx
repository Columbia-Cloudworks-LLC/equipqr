
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { resetAuthState } from '@/utils/authInterceptors';

interface AuthErrorStateProps {
  errorMessage: string;
}

export function AuthErrorState({ errorMessage }: AuthErrorStateProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex-1 p-6">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
      
      <div className="flex justify-center mt-4">
        <Button 
          onClick={() => {
            resetAuthState();
            navigate('/auth', { replace: true });
          }}
        >
          Go to Login
        </Button>
      </div>
    </div>
  );
}
