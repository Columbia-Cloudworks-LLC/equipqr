
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShieldAlert, UserPlus, ArrowUpRight } from "lucide-react";

interface MembershipAlertProps {
  team: any;
  onRepair: () => void;
  isRepairing: boolean;
  role: string | null;
  onUpgrade: () => void;
  onRequestUpgrade: () => void;
  isUpgrading: boolean;
  isRequesting: boolean;
  canUpgrade: boolean;
}

export function MembershipAlert({
  team,
  onRepair,
  isRepairing,
  role,
  onUpgrade,
  onRequestUpgrade,
  isUpgrading,
  isRequesting,
  canUpgrade
}: MembershipAlertProps) {
  // Handle viewers that need role upgrade
  if (role === 'viewer') {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <ShieldAlert className="h-5 w-5 text-amber-500" />
        <AlertTitle>Viewer Access Only</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <p>
            You currently have view-only access to this team. To manage members,
            you need at least a manager role.
          </p>
          <div>
            <Button 
              variant="outline" 
              className="border-amber-200 text-amber-700 hover:text-amber-800 hover:bg-amber-100"
              disabled={isUpgrading || isRequesting}
              onClick={canUpgrade ? onUpgrade : onRequestUpgrade}
            >
              {isUpgrading || isRequesting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {canUpgrade ? "Upgrading role..." : "Requesting upgrade..."}
                </span>
              ) : (
                <>
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  {canUpgrade ? "Upgrade to manager" : "Request role upgrade"}
                </>
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // For external organizations
  if (team?.is_external_org) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <ExternalLink className="h-5 w-5 text-blue-500" />
        <AlertTitle>External Organization Team</AlertTitle>
        <AlertDescription>
          <p>
            This team belongs to {team?.org_name || 'another organization'}.
            You have access through cross-organization permissions.
          </p>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Default case: user has no access
  return (
    <Alert variant="destructive">
      <ShieldAlert className="h-5 w-5" />
      <AlertTitle>Access Required</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p>
          You don't appear to be a member of this team. This could happen if
          there was an issue during team creation or if your membership was removed.
        </p>
        <div>
          <Button 
            variant="outline" 
            className="bg-white text-destructive hover:bg-destructive/10"
            disabled={isRepairing}
            onClick={onRepair}
          >
            {isRepairing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Repairing...
              </span>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Repair team access
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
