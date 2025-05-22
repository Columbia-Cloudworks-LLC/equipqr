
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function UnauthenticatedState() {
  const navigate = useNavigate();
  
  return (
    <div className="flex-1 p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          You must be logged in to view this page.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-center mt-4">
        <Button 
          onClick={() => navigate('/auth')}
          className="mt-4"
        >
          Go to Login
        </Button>
      </div>
    </div>
  );
}
