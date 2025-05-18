
import { useState } from 'react';
import { TeamMembers } from './TeamMembers';
import { TeamSettings } from './TeamSettings';
import { RepairTeamAccess } from './RepairTeamAccess';
import { MembershipAlert } from './MembershipAlert';
import { Skeleton } from '../ui/skeleton';
import { UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface TeamContentProps {
  selectedTeamId: string;
  members: any[];
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
  currentUserRole?: string;
  canChangeRoles: boolean;
  onInviteMember: (email: string, role: string, teamId: string) => void;
  onChangeRole: (id: string, role: string, teamId: string) => void;
  onRemoveMember: (id: string, teamId: string) => void;
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvitation: (id: string) => Promise<void>;
  onCreateTeam: (name: string) => void;
  onUpdateTeam: (id: string, name: string) => Promise<void>;
  onDeleteTeam: (id: string) => Promise<void>;
  onRepairTeam: (teamId: string) => void;
  onUpgradeRole: (teamId: string) => void;
  onRequestRoleUpgrade: (teamId: string) => void;
  onFetchPendingInvitations: () => void;
  getTeamEquipmentCount?: (teamId: string) => Promise<number>;
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
  const [activeTab, setActiveTab] = useState('members');
  
  if (!selectedTeamId) {
    return null;
  }

  // Find selected team for more details
  const selectedTeam = teams.find(team => team.id === selectedTeamId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Step 1: Show repair option if user is not a team member
  if (!isMember) {
    return (
      <RepairTeamAccess 
        selectedTeamId={selectedTeamId} 
        onRepairTeam={(id) => onRepairTeam(id)} 
        isRepairingTeam={isRepairingTeam} 
        teamDetails={selectedTeam}
      />
    );
  }

  // Step 2: Show appropriate content based on membership status and role
  return (
    <div className="space-y-4">
      {/* Membership alerts for special cases */}
      <MembershipAlert
        team={selectedTeam}
        onRepair={() => onRepairTeam(selectedTeamId)}
        isRepairing={isRepairingTeam}
        role={currentUserRole || null}
        onUpgrade={() => onUpgradeRole(selectedTeamId)}
        onRequestUpgrade={() => onRequestRoleUpgrade(selectedTeamId)}
        isUpgrading={isUpgradingRole}
        isRequesting={isRequestingRole}
        canUpgrade={canChangeRoles}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              {selectedTeam?.name || "Team Details"} 
              {selectedTeam?.is_external_org && " (External)"}
            </div>
          </CardTitle>
          <CardDescription>
            {selectedTeam?.is_external_org 
              ? `This team belongs to ${selectedTeam?.org_name || 'another organization'}`
              : "Manage team members and settings"
            }
          </CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardContent className="pb-0">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="members" className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                Team Members
              </TabsTrigger>
              <TabsTrigger value="settings">
                Team Settings
              </TabsTrigger>
            </TabsList>
          </CardContent>

          <TabsContent value="members" className="mt-0">
            <CardContent>
              <TeamMembers 
                members={members}
                pendingInvitations={pendingInvitations}
                isLoading={isLoading}
                isLoadingInvitations={isLoadingInvitations}
                teamId={selectedTeamId}
                onInviteMember={onInviteMember}
                onChangeRole={onChangeRole}
                onRemoveMember={onRemoveMember}
                onResendInvite={onResendInvite}
                onCancelInvitation={onCancelInvitation}
                onFetchPendingInvitations={onFetchPendingInvitations}
                currentUserRole={currentUserRole}
                canChangeRoles={canChangeRoles}
              />
            </CardContent>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <CardContent>
              <TeamSettings
                team={selectedTeam}
                onUpdateTeam={onUpdateTeam}
                onDeleteTeam={onDeleteTeam}
                isUpdating={isUpdatingTeam}
                isDeleting={isDeletingTeam}
                currentUserRole={currentUserRole || 'viewer'}
                getTeamEquipmentCount={getTeamEquipmentCount}
              />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
