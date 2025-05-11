
import { TeamList } from '@/components/Team/TeamList';
import { InviteForm } from '@/components/Team/InviteForm';
import { TeamCreationForm } from '@/components/Team/TeamCreationForm';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Tool } from "lucide-react";

interface TeamContentProps {
  selectedTeamId: string;
  members: TeamMember[];
  teams: { id: string; name: string }[];
  isLoading: boolean;
  isCreatingTeam: boolean;
  isRepairingTeam?: boolean;
  isMember?: boolean;
  onInviteMember: (email: string, role: UserRole, teamId: string) => void;
  onChangeRole: (id: string, role: UserRole, teamId: string) => void;
  onRemoveMember: (id: string, teamId: string) => void;
  onResendInvite: (id: string) => void;
  onCreateTeam: (name: string) => void;
  onRepairTeam?: (teamId: string) => void;
}

export function TeamContent({
  selectedTeamId,
  members,
  teams,
  isLoading,
  isCreatingTeam,
  isRepairingTeam = false,
  isMember = true,
  onInviteMember,
  onChangeRole,
  onRemoveMember,
  onResendInvite,
  onCreateTeam,
  onRepairTeam
}: TeamContentProps) {
  if (selectedTeamId && !isMember && onRepairTeam) {
    return (
      <div className="space-y-4">
        <Alert variant="warning">
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
                <Tool className="h-4 w-4" />
                {isRepairingTeam ? 'Repairing...' : 'Repair Team Membership'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Tabs defaultValue="members" className="w-full">
      <TabsList>
        <TabsTrigger value="members">Team Members</TabsTrigger>
        <TabsTrigger value="invite">Invite People</TabsTrigger>
        <TabsTrigger value="create">Create Team</TabsTrigger>
      </TabsList>
      
      <TabsContent value="members" className="mt-6">
        {selectedTeamId ? (
          <TeamList
            members={members}
            onRemoveMember={onRemoveMember}
            onChangeRole={onChangeRole}
            onResendInvite={onResendInvite}
            teamId={selectedTeamId}
          />
        ) : (
          <p>Select a team to view members</p>
        )}
      </TabsContent>
      
      <TabsContent value="invite" className="mt-6 max-w-md">
        <InviteForm 
          onInvite={onInviteMember} 
          isLoading={isLoading}
          teams={teams}
        />
      </TabsContent>
      
      <TabsContent value="create" className="mt-6 max-w-md">
        <TeamCreationForm 
          onCreateTeam={onCreateTeam}
          isLoading={isCreatingTeam}
        />
      </TabsContent>
    </Tabs>
  );
}
