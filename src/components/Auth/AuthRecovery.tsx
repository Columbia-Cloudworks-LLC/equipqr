
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { performFullAuthReset } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';
import { repairSessionStorage } from '@/utils/storage';

interface AuthRecoveryProps {
  message?: string;
  onRetry?: () => void;
}

export function AuthRecovery({ message, onRetry }: AuthRecoveryProps) {
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairAttempted, setRepairAttempted] = useState(false);
  const [repairResult, setRepairResult] = useState<string | null>(null);
  const navigate = useNavigate();

  // Auto-repair on component mount
  useEffect(() => {
    const attemptAutoRepair = async () => {
      setIsRepairing(true);
      try {
        const repaired = await repairSessionStorage();
        if (repaired) {
          setRepairResult('Automated repair successful. Trying to continue...');
          // Wait a moment for storage operations to complete
          setTimeout(() => {
            if (onRetry) {
              onRetry();
            }
          }, 1000);
        } else {
          setRepairResult('No issues found with automated repair.');
        }
      } catch (error) {
        console.error('Auto-repair failed:', error);
        setRepairResult('Automated repair failed.');
      } finally {
        setRepairAttempted(true);
        setIsRepairing(false);
      }
    };
    
    attemptAutoRepair();
  }, [onRetry]);

  const handleReset = () => {
    performFullAuthReset();
    // After a full reset, redirect to auth page
    navigate('/auth');
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // No retry handler provided, just refresh the page
      window.location.reload();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Authentication Problem Detected
        </CardTitle>
        <CardDescription>
          {message || "There was a problem with your authentication state."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRepairing ? (
          <div className="flex flex-col items-center justify-center p-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-center text-sm text-muted-foreground">
              Attempting to repair authentication...
            </p>
          </div>
        ) : repairAttempted && repairResult ? (
          <Alert variant={repairResult.includes('successful') ? 'default' : 'destructive'}>
            <AlertDescription>{repairResult}</AlertDescription>
          </Alert>
        ) : null}
        
        <div className="text-sm space-y-2">
          <p>This issue might be caused by:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Storage inconsistency between IndexedDB and localStorage</li>
            <li>Browser cookie limitations</li>
            <li>Authentication token expiration</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          onClick={handleRetry} 
          className="w-full"
          variant="outline"
          disabled={isRepairing}
        >
          Retry
        </Button>
        <Button 
          onClick={handleReset} 
          className="w-full"
          variant="destructive"
          disabled={isRepairing}
        >
          Reset Authentication & Sign In Again
        </Button>
      </CardFooter>
    </Card>
  );
}
