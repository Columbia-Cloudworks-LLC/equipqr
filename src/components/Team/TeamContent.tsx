
import { TeamMember } from "@/types";
import { UserRole } from "@/types/supabase-enums";
import { TeamSettings } from "./TeamSettings";
import { TeamMembers } from "./TeamMembers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { EmptyTeamState } from "./EmptyTeamState";
import { TeamMembersList } from "./TeamMembersList";
import { TeamInvitationsList } from "./TeamInvitationsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamContentProps {
  selectedTeamId: string;
  teams: any[];
  members: TeamMember[];
  pendingInvitations: any[];
  isLoading: boolean;
  isLoadingInvitations: boolean;
  isCreatingTeam: boolean;
  isUpdatingTeam: boolean;
  isDeletingTeam: boolean;
  isRepairingTeam: boolean;
  isUpgradingRole: boolean;
  isRequestingRole: boolean;
  isMember: boolean;
  currentUserRole: string | null;
  canChangeRoles: boolean;
  onInviteMember: (email: string, role: UserRole, teamId: string) => Promise<void>;
  onChangeRole: (userId: string, role: UserRole, teamId: string) => Promise<void>;
  onRemoveMember: (userId: string, teamId: string) => Promise<void>;
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvitation: (id: string) => Promise<void>;
  onCreateTeam: (name: string) => Promise<any>;
  onUpdateTeam: (id: string, name: string) => Promise<void>;
  onDeleteTeam: (id: string) => Promise<void>;
  onRepairTeam: (teamId: string) => Promise<void>;
  onUpgradeRole: (teamId: string) => Promise<void>;
  onRequestRoleUpgrade: (teamId: string) => Promise<void>;
  onFetchPendingInvitations: () => Promise<void>;
  getTeamEquipmentCount: (teamId: string) => Promise<number>;
}

export function TeamContent({ 
  selectedTeamId,
  teams,
  members,
  pendingInvitations,
  isLoading,
  isLoadingInvitations,
  isCreatingTeam,
  isUpdatingTeam,
  isDeletingTeam,
  isRepairingTeam,
  isUpgradingRole,
  isRequestingRole,
  isMember,
  currentUserRole,
  canChangeRoles,
  onInviteMember,
  onChangeRole,
  onRemoveMember,
  onResendInvite,
  onCancelInvitation,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  onRepairTeam,
  onUpgradeRole,
  onRequestRoleUpgrade,
  onFetchPendingInvitations,
  getTeamEquipmentCount
}: TeamContentProps) {

  // Find the current team in the teams list
  const selectedTeam = teams.find(team => team.id === selectedTeamId);
  const isTeamDeleted = !selectedTeam && selectedTeamId;
  
  // If team is deleted but still in URL, show an alert
  if (isTeamDeleted && !isLoading) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          The selected team no longer exists. It may have been deleted.
          Please select another team from the dropdown.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Handle no teams case
  if (!selectedTeamId || teams.length === 0) {
    return (
      <EmptyTeamState 
        onCreateTeam={onCreateTeam}
        isCreatingTeam={isCreatingTeam}
      />
    );
  }
  
  const hasInvitations = pendingInvitations && pendingInvitations.length > 0;
  
  const canManageTeam = currentUserRole === 'manager' || currentUserRole === 'owner';
  
  return (
    <div className="mt-4">
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invitations" disabled={!canManageTeam}>
            Invitations {hasInvitations ? `(${pendingInvitations.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="settings" disabled={!canManageTeam}>Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members">
          <TeamMembers
            teamId={selectedTeamId}
            teamName={selectedTeam?.name || 'Unknown Team'}
            members={members}
            isLoading={isLoading}
            currentUserRole={currentUserRole || undefined}
            isMember={isMember}
            canChangeRoles={canChangeRoles}
            isUpgradingRole={isUpgradingRole}
            isRequestingRole={isRequestingRole}
            onInviteMember={onInviteMember}
            onChangeRole={onChangeRole}
            onRemoveMember={onRemoveMember}
            onUpgradeRole={onUpgradeRole}
            onRequestRoleUpgrade={onRequestRoleUpgrade}
            isRepairingTeam={isRepairingTeam}
            onRepairTeam={onRepairTeam}
          >
            <TeamMembersList 
              members={members}
              teamId={selectedTeamId}
              isLoading={isLoading}
              currentUserRole={currentUserRole || undefined}
              onChangeRole={onChangeRole}
              onRemoveMember={onRemoveMember}
              onResendInvite={onResendInvite}
            />
          </TeamMembers>
        </TabsContent>
        
        <TabsContent value="invitations">
          <TeamInvitationsList 
            invitations={pendingInvitations}
            teamId={selectedTeamId}
            isLoading={isLoadingInvitations}
            onResend={onResendInvite}
            onCancel={onCancelInvitation}
            onRefresh={onFetchPendingInvitations}
          />
        </TabsContent>
        
        <TabsContent value="settings">
          <TeamSettings 
            team={selectedTeam}
            isUpdating={isUpdatingTeam}
            isDeleting={isDeletingTeam}
            onUpdateTeam={onUpdateTeam}
            onDelete={onDeleteTeam}
            currentUserRole={currentUserRole || undefined}
            getTeamEquipmentCount={getTeamEquipmentCount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
