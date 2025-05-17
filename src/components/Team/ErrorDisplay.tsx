
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowUpToLine, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onUpgradeRole?: () => void; 
  isViewer?: boolean; 
  canDirectlyUpgrade?: boolean;
  isRequestingUpgrade?: boolean;
  crossOrgPermissionError?: boolean;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onUpgradeRole, 
  isViewer = false, 
  canDirectlyUpgrade = false,
  isRequestingUpgrade = false,
  crossOrgPermissionError = false
}: ErrorDisplayProps) {
  if (!error && !isViewer && !crossOrgPermissionError) return null;
  
  // Define specific helpful messages for common errors
  const getHelpfulMessage = () => {
    if (crossOrgPermissionError) {
      return "You don't have sufficient permissions to perform this action on resources from another organization.";
    } else if (error?.includes('team members')) {
      return "Please try refreshing the page, or check if you have the necessary permissions.";
    } else if (error?.includes('Team ID')) {
      return "There may be an issue with your team selection. Try selecting a different team or returning to the dashboard.";
    } else if (error?.includes('format is invalid')) {
      return "The team identifier appears to be in an invalid format. Try selecting a team from the dropdown.";
    } else if (error?.includes('Repair failed')) {
      return "The team repair process encountered an error. This might be due to permission issues or database constraints. Try signing out and signing back in, or contact your organization administrator.";
    } else if (error?.includes('not a member')) {
      return "You don't have access to this team. Use the 'Repair Team Membership' option to fix this issue.";
    } else if (error?.includes('different organization') || error?.includes('cross-organization')) {
      return "This resource belongs to another organization. You may have limited access based on your permissions.";
    }
    return null;
  };
  
  const helpfulMessage = getHelpfulMessage();
  
  // Special case for cross-organization permission errors
  if (crossOrgPermissionError) {
    return (
      <Alert variant="warning" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Cross-Organization Access Limited</AlertTitle>
        <AlertDescription>
          You have limited permissions for this resource because it belongs to another organization.
          Some actions may not be available.
          <div className="mt-2 text-sm">
            If you need additional access, please contact the resource owner or your administrator.
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  // If the user is a viewer but has no other errors, show a special message
  if (isViewer && !error) {
    return (
      <Alert variant="warning" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Limited Access</AlertTitle>
        <AlertDescription>
          You currently have a viewer role for this team. Some management actions may be restricted.
          {onUpgradeRole && (
            <div className="mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onUpgradeRole} 
                disabled={isRequestingUpgrade}
                className="flex items-center gap-2"
              >
                <ArrowUpToLine className="h-4 w-4" />
                {isRequestingUpgrade ? 'Processing...' : canDirectlyUpgrade 
                  ? 'Upgrade to Manager Role' 
                  : 'Request Manager Role'}
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
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
        <div className="mt-3 space-x-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          )}
          {onUpgradeRole && isViewer && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onUpgradeRole}
              disabled={isRequestingUpgrade}
              className="flex items-center gap-2"
            >
              <ArrowUpToLine className="h-4 w-4" />
              {isRequestingUpgrade ? 'Processing...' : canDirectlyUpgrade 
                ? 'Upgrade to Manager Role' 
                : 'Request Manager Role'}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
