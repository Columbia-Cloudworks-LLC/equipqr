
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowUp, MessageSquare } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
  onRetry: () => void;
  onUpgradeRole?: () => void;
  isViewer?: boolean;
  canDirectlyUpgrade?: boolean;
  isRequestingUpgrade?: boolean;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onUpgradeRole, 
  isViewer = false,
  canDirectlyUpgrade = false,
  isRequestingUpgrade = false
}: ErrorDisplayProps) {
  if (!error) return null;

  // Enhanced error message handling for organization owners
  const isPermissionError = error.includes('permission') || error.includes('access');
  const isOrgOwnerError = error.includes('organization') && error.includes('owner');
  const isTeamMemberError = error.includes('not a member');

  // Better error messaging for organization context
  const getErrorMessage = () => {
    if (isOrgOwnerError) {
      return "There seems to be an issue with organization-level permissions. As an organization owner, you should have access to manage all teams in your organization.";
    }
    
    if (isTeamMemberError && !isViewer) {
      return "You don't appear to be a member of this team, but you may have organization-level access. Try refreshing to reload your permissions.";
    }
    
    return error;
  };

  const getActionButtons = () => {
    const buttons = [];
    
    // Always show retry button for permission errors
    if (isPermissionError) {
      buttons.push(
        <Button 
          key="retry"
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Permissions
        </Button>
      );
    }
    
    // Role upgrade options for viewers
    if (isViewer && onUpgradeRole) {
      if (canDirectlyUpgrade) {
        buttons.push(
          <Button 
            key="upgrade"
            size="sm" 
            onClick={onUpgradeRole}
            disabled={isRequestingUpgrade}
            className="flex items-center gap-2"
          >
            <ArrowUp className="h-4 w-4" />
            {isRequestingUpgrade ? 'Upgrading...' : 'Upgrade Role'}
          </Button>
        );
      } else {
        buttons.push(
          <Button 
            key="request"
            variant="outline" 
            size="sm" 
            onClick={onUpgradeRole}
            disabled={isRequestingUpgrade}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            {isRequestingUpgrade ? 'Requesting...' : 'Request Access'}
          </Button>
        );
      }
    }
    
    return buttons;
  };

  const actionButtons = getActionButtons();

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{getErrorMessage()}</span>
        {actionButtons.length > 0 && (
          <div className="flex gap-2 ml-4">
            {actionButtons}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
