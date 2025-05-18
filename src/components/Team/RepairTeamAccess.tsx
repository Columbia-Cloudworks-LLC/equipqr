
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CircleAlert, UserCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RepairTeamAccessProps {
  selectedTeamId: string;
  onRepairTeam: (teamId: string) => void;
  isRepairingTeam: boolean;
  teamDetails?: any;
}

export function RepairTeamAccess({
  selectedTeamId,
  onRepairTeam,
  isRepairingTeam,
  teamDetails
}: RepairTeamAccessProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Issue Detected</AlertTitle>
        <AlertDescription className="space-y-4">
          <div>
            You don't appear to be a member of this team 
            {teamDetails?.name ? ` (${teamDetails.name})` : ''}, 
            possibly due to an issue during team creation.
          </div>
          
          <div className="mt-4">
            <Button
              onClick={() => onRepairTeam(selectedTeamId)}
              disabled={isRepairingTeam}
              className="flex items-center gap-2"
            >
              {isRepairingTeam ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Repairing...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Repair Team Membership
                </>
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
