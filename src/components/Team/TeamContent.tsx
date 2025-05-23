
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
import { useIsMobile } from "@/hooks/use-mobile";

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
  onInviteMember: (email: string, role: UserRole) => Promise<any>;
  onChangeRole: (userId: string, role: string) => Promise<any>;
  onRemoveMember: (userId: string) => Promise<any>;
  onResendInvite: (inviteId: string) => Promise<any>;
  onCancelInvitation: (inviteId: string) => Promise<any>;
  onCreateTeam: (name: string) => Promise<any>;
  onUpdateTeam: (id: string, name: string) => Promise<any>;
  onDeleteTeam: (teamId: string) => Promise<any>;
  onRepairTeam: () => Promise<any>;
  onUpgradeRole: () => Promise<any>;
  onRequestRoleUpgrade: () => Promise<any>;
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
  const isMobile = useIsMobile();

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

  // Create adapter functions to handle type conversion
  const handleInviteMember = (email: string, role: UserRole) => {
    return onInviteMember(email, role);
  };
  
  const handleChangeRole = (userId: string, role: UserRole) => {
    return onChangeRole(userId, role as string);
  };
  
  return (
    <div className="mt-4">
      <Tabs defaultValue="members">
        <TabsList className={`${isMobile ? 'w-full' : ''}`}>
          <TabsTrigger value="members" className={`${isMobile ? 'flex-1' : ''}`}>
            Members
          </TabsTrigger>
          <TabsTrigger 
            value="invitations" 
            disabled={!canManageTeam}
            className={`${isMobile ? 'flex-1' : ''}`}
          >
            {isMobile ? 'Invites' : 'Invitations'} {hasInvitations ? `(${pendingInvitations.length})` : ''}
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            disabled={!canManageTeam}
            className={`${isMobile ? 'flex-1' : ''}`}
          >
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className={`${isMobile ? 'px-0' : ''}`}>
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
            onInviteMember={handleInviteMember}
            onChangeRole={handleChangeRole}
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
              onChangeRole={handleChangeRole}
              onRemoveMember={onRemoveMember}
              onResendInvite={onResendInvite}
            />
          </TeamMembers>
        </TabsContent>
        
        <TabsContent value="invitations" className={`${isMobile ? 'px-0' : ''}`}>
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
        
        <TabsContent value="settings" className={`${isMobile ? 'px-0' : ''}`}>
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
