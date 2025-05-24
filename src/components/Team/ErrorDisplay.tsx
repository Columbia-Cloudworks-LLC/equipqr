
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowUp, MessageSquare, Info } from 'lucide-react';

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

  // Check if this looks like organization-level access that should be transparent
  const isOrgAccessScenario = error.includes('organization-level access') || 
    (error.includes('You are managing teams') && error.includes('manager access'));

  // Better error messaging for organization context
  const getErrorMessage = () => {
    if (isOrgAccessScenario) {
      return null; // Don't show an error for expected org access scenarios
    }
    
    if (isOrgOwnerError) {
      return "As an organization owner, you have full access to manage teams. The member list includes both direct team members and organization managers who have authority over this team.";
    }
    
    if (isTeamMemberError && !isViewer) {
      return "You have organization-level access to this team. Organization managers are shown in the member list to provide transparency about team authority.";
    }
    
    return error;
  };

  const errorMessage = getErrorMessage();
  
  // Don't render the error display if this is expected org access behavior
  if (!errorMessage) {
    return null;
  }

  // Use Info variant for organization access messages instead of destructive
  const isInfoMessage = isOrgOwnerError || (isTeamMemberError && !isViewer);
  
  const getActionButtons = () => {
    const buttons = [];
    
    // Always show retry button for permission errors
    if (isPermissionError && !isInfoMessage) {
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
    if (isViewer && onUpgradeRole && !isInfoMessage) {
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
    <Alert variant={isInfoMessage ? "default" : "destructive"} className="mb-4">
      {isInfoMessage ? <Info className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      <AlertDescription className="flex items-center justify-between">
        <span>{errorMessage}</span>
        {actionButtons.length > 0 && (
          <div className="flex gap-2 ml-4">
            {actionButtons}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
