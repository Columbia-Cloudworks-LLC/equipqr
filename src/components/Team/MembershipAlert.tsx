
import { ExternalLink, Info, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface MembershipAlertProps {
  team?: {
    name?: string;
    is_external_org?: boolean;
    org_name?: string;
  } | null;
  onRepair: () => void;
  isRepairing: boolean;
  role: string | null;
  onUpgrade?: () => void;
  onRequestUpgrade?: () => void;
  isUpgrading?: boolean;
  isRequesting?: boolean;
  canUpgrade?: boolean;
}

export function MembershipAlert({
  team,
  onRepair,
  isRepairing,
  role,
  onUpgrade,
  onRequestUpgrade,
  isUpgrading = false,
  isRequesting = false,
  canUpgrade = false
}: MembershipAlertProps) {
  if (!team) return null;
  
  // Check if viewer role
  const isViewerRole = role === 'viewer';
  
  // Check if external organization
  const isExternalOrg = team.is_external_org;
  
  // If viewer role, show limited access alert
  if (isViewerRole && (onUpgrade || onRequestUpgrade)) {
    return (
      <Alert variant="warning" className="bg-amber-50 mb-4">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-700">Limited Access</AlertTitle>
        <AlertDescription className="text-amber-700 flex items-center justify-between">
          <span>You have view-only access to this team. Some actions will be restricted.</span>
          {canUpgrade && onUpgrade ? (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={onUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? "Upgrading..." : "Upgrade to Manager"}
            </Button>
          ) : onRequestUpgrade ? (
            <Button
              variant="outline" 
              size="sm"
              onClick={onRequestUpgrade}
              disabled={isRequesting}
            >
              {isRequesting ? "Requesting..." : "Request Manager Access"}
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }
  
  // If external org, show info alert
  if (isExternalOrg) {
    return (
      <Alert variant="default" className="bg-blue-50 border-blue-200 mb-4">
        <ExternalLink className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-700">External Team</AlertTitle>
        <AlertDescription className="text-blue-700">
          This team belongs to {team.org_name || 'another organization'}.
          {role ? ` You have ${role} access to this team.` : ''}
        </AlertDescription>
      </Alert>
    );
  }
  
  // No alert needed
  return null;
}
