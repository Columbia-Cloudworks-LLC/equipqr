
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RepairTeamAccessProps {
  selectedTeamId: string;
  onRepairTeam: (teamId: string) => void;
  isRepairingTeam: boolean;
}

export function RepairTeamAccess({
  selectedTeamId,
  onRepairTeam,
  isRepairingTeam
}: RepairTeamAccessProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Issue Detected</AlertTitle>
        <AlertDescription>
          You don't appear to be a member of this team, possibly due to an issue during team creation.
          <div className="mt-4">
            <Button
              onClick={() => onRepairTeam(selectedTeamId)}
              disabled={isRepairingTeam}
              className="flex items-center gap-2"
            >
              <CircleAlert className="h-4 w-4" />
              {isRepairingTeam ? 'Repairing...' : 'Repair Team Membership'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
