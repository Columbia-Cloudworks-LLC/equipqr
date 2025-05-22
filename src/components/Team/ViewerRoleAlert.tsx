
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowUpToLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewerRoleAlertProps {
  canUpgrade: boolean; // Added this prop
  isUpgrading: boolean;
  isRequesting: boolean;
  onUpgrade: () => Promise<void>;
  onRequest: () => Promise<void>;
}

export function ViewerRoleAlert({
  canUpgrade,
  isUpgrading,
  isRequesting,
  onUpgrade,
  onRequest
}: ViewerRoleAlertProps) {
  const handleRoleAction = () => {
    if (canUpgrade) {
      onUpgrade();
    } else {
      onRequest();
    }
  };
  
  return (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Viewer Role Detected</AlertTitle>
      <AlertDescription>
        You currently have view-only access to this team. To manage team members or make changes, you need a manager role.
        <div className="mt-4">
          <Button
            onClick={handleRoleAction}
            disabled={isUpgrading || isRequesting}
            className="flex items-center gap-2"
          >
            <ArrowUpToLine className="h-4 w-4" />
            {isUpgrading || isRequesting ? 'Processing...' : 
             canUpgrade ? 'Upgrade to Manager Role' : 'Request Manager Role'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
