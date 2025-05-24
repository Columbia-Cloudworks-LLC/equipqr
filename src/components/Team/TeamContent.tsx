
import { TeamMembers } from './TeamMembers';
import { TeamSettings } from './TeamSettings';
import { TeamEquipmentMap } from './TeamEquipmentMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, Map } from 'lucide-react';
import { Team } from '@/services/team';
import { UserRole } from '@/types/supabase-enums';

interface TeamContentProps {
  selectedTeam: Team;
  teams: Team[];
  members: any[];
  pendingInvitations: any[];
  isLoading: boolean;
  currentUserRole?: string;
  isMember: boolean;
  canChangeRoles: boolean;
  isUpgradingRole: boolean;
  isRequestingRole: boolean;
  onInviteMember: (email: string, role: UserRole, teamId: string) => Promise<any>;
  onChangeRole: (userId: string, role: UserRole) => Promise<any>;
  onRemoveMember: (userId: string) => Promise<any>;
  onUpdateTeam: (teamId: string, data: { name: string }) => Promise<any>;
  onDeleteTeam: (teamId: string) => Promise<any>;
  onUpgradeRole: () => Promise<void>;
  onRequestRoleUpgrade: () => Promise<void>;
  isRepairingTeam: boolean;
  onRepairTeam: () => Promise<void>;
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvitation: (id: string) => Promise<void>;
  getTeamEquipmentCount: (teamId: string) => Promise<number>;
}

export function TeamContent({
  selectedTeam,
  teams,
  members,
  pendingInvitations,
  isLoading,
  currentUserRole,
  isMember,
  canChangeRoles,
  isUpgradingRole,
  isRequestingRole,
  onInviteMember,
  onChangeRole,
  onRemoveMember,
  onUpdateTeam,
  onDeleteTeam,
  onUpgradeRole,
  onRequestRoleUpgrade,
  isRepairingTeam,
  onRepairTeam,
  onResendInvite,
  onCancelInvitation,
  getTeamEquipmentCount
}: TeamContentProps) {
  const handleInviteMember = (email: string, role: UserRole) => {
    return onInviteMember(email, role, selectedTeam.id);
  };

  const handleUpdateTeam = (teamId: string, name: string) => {
    return onUpdateTeam(teamId, { name });
  };

  const handleDeleteTeam = (teamId: string) => {
    return onDeleteTeam(teamId);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Equipment Map
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="mt-6">
          <TeamMembers
            teamId={selectedTeam.id}
            teamName={selectedTeam.name}
            members={members}
            pendingInvitations={pendingInvitations}
            teams={teams}
            isLoading={isLoading}
            currentUserRole={currentUserRole}
            isMember={isMember}
            canChangeRoles={canChangeRoles}
            isUpgradingRole={isUpgradingRole}
            isRequestingRole={isRequestingRole}
            onInviteMember={handleInviteMember}
            onChangeRole={onChangeRole}
            onRemoveMember={onRemoveMember}
            onUpgradeRole={onUpgradeRole}
            onRequestRoleUpgrade={onRequestRoleUpgrade}
            isRepairingTeam={isRepairingTeam}
            onRepairTeam={onRepairTeam}
            onResendInvite={onResendInvite}
            onCancelInvitation={onCancelInvitation}
          />
        </TabsContent>
        
        <TabsContent value="map" className="mt-6">
          <TeamEquipmentMap teamId={selectedTeam.id} teamName={selectedTeam.name} />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <TeamSettings
            team={selectedTeam}
            onUpdateTeam={handleUpdateTeam}
            onDelete={handleDeleteTeam}
            currentUserRole={currentUserRole}
            canChangeRoles={canChangeRoles}
            getTeamEquipmentCount={getTeamEquipmentCount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
