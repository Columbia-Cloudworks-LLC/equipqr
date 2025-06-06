
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface AuthPatternWarningProps {
  failureCount: number;
  onDismiss?: () => void;
}

export function AuthPatternWarning({ failureCount, onDismiss }: AuthPatternWarningProps) {
  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="space-y-2">
          <p className="font-medium">Security Notice</p>
          <p className="text-sm">
            We detected {failureCount} failed sign-in attempt{failureCount > 1 ? 's' : ''} for this email in the past hour. 
            Please verify your credentials carefully.
          </p>
          {failureCount > 3 && (
            <p className="text-sm">
              If you're having trouble remembering your password, consider using the "Forgot password?" link below.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
