
import { AlertCircle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface RepairTeamAccessProps {
  selectedTeamId: string;
  onRepairTeam: (id: string) => void;
  isRepairingTeam: boolean;
  teamDetails?: { 
    name?: string;
    org_id?: string;
    org_name?: string;
  } | null;
}

export function RepairTeamAccess({ 
  selectedTeamId, 
  onRepairTeam, 
  isRepairingTeam,
  teamDetails
}: RepairTeamAccessProps) {
  return (
    <Card className="border-amber-300 bg-amber-50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700">
          <AlertCircle className="h-5 w-5" />
          Team Access Issue Detected
        </CardTitle>
        <CardDescription className="text-amber-700">
          You don't appear to be a member of this team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-amber-700">
            {teamDetails?.name ? (
              <>
                The team <span className="font-medium">{teamDetails.name}</span> exists, but you don't have access to it.
                {teamDetails.org_name && <> This team belongs to <span className="font-medium">{teamDetails.org_name}</span>.</>}
              </>
            ) : (
              <>
                This team exists, but you don't have access to it. This can happen if:
                <ul className="list-disc pl-6 mt-2">
                  <li>You created the team but were removed from it</li>
                  <li>The team belongs to an organization you're not part of</li>
                  <li>There was an issue during team creation</li>
                </ul>
              </>
            )}
          </p>
          
          <div className="bg-white rounded-md p-4 border border-amber-200">
            <h4 className="font-medium mb-2 text-amber-800">Auto-repair options</h4>
            <p className="text-sm text-amber-700 mb-4">
              If you should have access to this team, you can attempt to repair your access.
              This will try to add you as a team manager if permitted by the system.
            </p>
            <Button
              onClick={() => onRepairTeam(selectedTeamId)}
              disabled={isRepairingTeam}
              className="w-full"
            >
              <Wrench className="mr-2 h-4 w-4" />
              {isRepairingTeam ? "Repairing Team Access..." : "Repair Team Access"}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-amber-600">
        Note: Team repair will only work if you created this team or belong to the same organization.
      </CardFooter>
    </Card>
  );
}
