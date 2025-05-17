
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowUpToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamList } from '@/components/Team/TeamList';
import { TeamCreationForm } from '@/components/Team/TeamCreationForm';
import { TeamMember } from '@/types';

interface ViewerRoleAlertProps {
  selectedTeamId: string;
  isUpgradingRole: boolean;
  isRequestingRole: boolean;
  canChangeRoles: boolean;
  onUpgradeRole?: (teamId: string) => void;
  onRequestRoleUpgrade?: (teamId: string) => void;
  onCreateTeam: (name: string) => void;
  isCreatingTeam: boolean;
  members: TeamMember[];
  currentUserRole?: string | null;
}

export function ViewerRoleAlert({
  selectedTeamId,
  isUpgradingRole,
  isRequestingRole,
  canChangeRoles,
  onUpgradeRole,
  onRequestRoleUpgrade,
  onCreateTeam,
  isCreatingTeam,
  members,
  currentUserRole
}: ViewerRoleAlertProps) {
  // Only show this component if the user actually has a viewer role
  // This prevents the misleading warning when a user is actually a manager
  if (currentUserRole && currentUserRole !== 'viewer') {
    console.log(`ViewerRoleAlert: Not showing alert because user has role ${currentUserRole}, not viewer`);
    return null;
  }
  
  // Extra safety check - even without a specific role assigned, if they can change roles, don't show viewer warning
  if (canChangeRoles) {
    console.log('ViewerRoleAlert: Not showing alert because canChangeRoles is true');
    return null;
  }
  
  console.log(`ViewerRoleAlert: Showing alert for role ${currentUserRole}, canChangeRoles: ${canChangeRoles}`);
  
  const handleRoleAction = () => {
    if (canChangeRoles && onUpgradeRole) {
      onUpgradeRole(selectedTeamId);
    } else if (onRequestRoleUpgrade) {
      onRequestRoleUpgrade(selectedTeamId);
    }
  };
  
  return (
    <div className="space-y-6">
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Viewer Role Detected</AlertTitle>
        <AlertDescription>
          You currently have view-only access to this team. To manage team members or make changes, you need a manager role.
          <div className="mt-4">
            <Button
              onClick={handleRoleAction}
              disabled={isUpgradingRole || isRequestingRole}
              className="flex items-center gap-2"
            >
              <ArrowUpToLine className="h-4 w-4" />
              {isUpgradingRole || isRequestingRole ? 'Processing...' : 
               canChangeRoles ? 'Upgrade to Manager Role' : 'Request Manager Role'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="create">Create Team</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="mt-6">
          <TeamList
            members={members}
            onRemoveMember={() => {}}
            onChangeRole={() => {}}
            onResendInvite={async () => {}}
            teamId={selectedTeamId}
            isViewOnly={true}
          />
        </TabsContent>
        
        <TabsContent value="create" className="mt-6 max-w-md">
          <TeamCreationForm 
            onCreateTeam={onCreateTeam}
            isLoading={isCreatingTeam}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
