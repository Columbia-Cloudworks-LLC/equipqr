
import { TeamList } from '@/components/Team/TeamList';
import { InviteForm } from '@/components/Team/InviteForm';
import { TeamCreationForm } from '@/components/Team/TeamCreationForm';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TeamContentProps {
  selectedTeamId: string;
  members: TeamMember[];
  teams: { id: string; name: string }[];
  isLoading: boolean;
  isCreatingTeam: boolean;
  onInviteMember: (email: string, role: UserRole, teamId: string) => void;
  onChangeRole: (id: string, role: UserRole, teamId: string) => void;
  onRemoveMember: (id: string, teamId: string) => void;
  onResendInvite: (id: string) => void;
  onCreateTeam: (name: string) => void;
}

export function TeamContent({
  selectedTeamId,
  members,
  teams,
  isLoading,
  isCreatingTeam,
  onInviteMember,
  onChangeRole,
  onRemoveMember,
  onResendInvite,
  onCreateTeam
}: TeamContentProps) {
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
