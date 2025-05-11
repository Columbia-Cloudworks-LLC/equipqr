
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  if (!error) return null;
  
  // Define specific helpful messages for common errors
  const getHelpfulMessage = () => {
    if (error.includes('team members')) {
      return "Please try refreshing the page, or check if you have the necessary permissions.";
    } else if (error.includes('Team ID')) {
      return "There may be an issue with your team selection. Try selecting a different team or returning to the dashboard.";
    } else if (error.includes('format is invalid')) {
      return "The team identifier appears to be in an invalid format. Try selecting a team from the dropdown.";
    } else if (error.includes('Repair failed')) {
      return "The team repair process encountered an error. This might be due to permission issues or database constraints. Try signing out and signing back in, or contact your organization administrator.";
    } else if (error.includes('not a member')) {
      return "You don't have access to this team. Use the 'Repair Team Membership' option to fix this issue.";
    }
    return null;
  };
  
  const helpfulMessage = getHelpfulMessage();
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error}
        {helpfulMessage && (
          <div className="mt-2 text-sm">
            {helpfulMessage}
          </div>
        )}
        {onRetry && (
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
