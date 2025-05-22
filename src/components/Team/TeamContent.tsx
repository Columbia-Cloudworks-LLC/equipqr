
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
import { Button } from "@/components/ui/button";

interface TeamContentProps {
  selectedTeamId: string;
  members: TeamMember[];
  pendingInvitations: any[];
  teams: any[];
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
  onInviteMember: (data: any) => Promise<any>;
  onChangeRole: (userId: string, role: string) => Promise<any>;
  onRemoveMember: (userId: string) => Promise<any>;
  onResendInvite: (inviteId: string) => Promise<any>;
  onCancelInvitation: (inviteId: string) => Promise<any>;
  onCreateTeam: (name: string) => Promise<any>;
  onUpdateTeam: (id: string, name: string) => Promise<any>;
  onDeleteTeam: (teamId: string) => Promise<any>;
  onRepairTeam: (teamId: string) => Promise<any>;
  onUpgradeRole: (teamId: string) => Promise<any>;
  onRequestRoleUpgrade: (teamId: string) => Promise<any>;
  onFetchPendingInvitations: () => Promise<any>;
  getTeamEquipmentCount: (teamId: string) => Promise<number>;
}

export function TeamContent({ 
  selectedTeamId,
  members,
  pendingInvitations,
  teams,
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
            onInviteMember={(email, role) => onInviteMember({ email, role, teamId: selectedTeamId })}
            onChangeRole={(userId, role) => onChangeRole(userId, role)}
            onRemoveMember={(userId) => onRemoveMember(userId)}
            onUpgradeRole={() => onUpgradeRole(selectedTeamId)}
            onRequestRoleUpgrade={() => onRequestRoleUpgrade(selectedTeamId)}
            isRepairingTeam={isRepairingTeam}
            onRepairTeam={() => onRepairTeam(selectedTeamId)}
          >
            <TeamMembersList 
              members={members}
              teamId={selectedTeamId}
              isLoading={isLoading}
              currentUserRole={currentUserRole || undefined}
              onChangeRole={(id, role) => onChangeRole(id, role)}
              onRemoveMember={(id) => onRemoveMember(id)}
            />
          </TeamMembers>
        </TabsContent>
        
        <TabsContent value="invitations">
          <TeamInvitationsList 
            invitations={pendingInvitations}
            teamId={selectedTeamId}
            isLoading={isLoadingInvitations}
            isViewOnly={!canManageTeam}
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
