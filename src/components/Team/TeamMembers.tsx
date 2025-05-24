
import { TeamMembersList } from './TeamMembersList';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/supabase-enums';
import { InviteMemberButton } from './InviteMemberButton';
import { ViewerRoleAlert } from './ViewerRoleAlert';
import { RepairTeamAccess } from './RepairTeamAccess';
import { MembershipAlert } from './MembershipAlert';
import { UserPlus } from 'lucide-react';
import { Team } from '@/services/team';

interface TeamMembersProps {
  teamId: string;
  teamName: string;
  members: any[];
  teams: Team[];
  isLoading: boolean;
  currentUserRole?: string;
  isMember: boolean;
  canChangeRoles: boolean;
  isUpgradingRole: boolean;
  isRequestingRole: boolean;
  onInviteMember: (email: string, role: UserRole) => Promise<any>;
  onChangeRole: (userId: string, role: UserRole) => Promise<any>;
  onRemoveMember: (userId: string) => Promise<any>;
  onUpgradeRole: () => Promise<void>;
  onRequestRoleUpgrade: () => Promise<void>;
  isRepairingTeam: boolean;
  onRepairTeam: () => Promise<void>;
  children?: React.ReactNode;
}

export function TeamMembers({
  teamId,
  teamName,
  members,
  teams,
  isLoading,
  currentUserRole,
  isMember,
  canChangeRoles,
  isUpgradingRole,
  isRequestingRole,
  onInviteMember,
  onChangeRole,
  onRemoveMember,
  onUpgradeRole,
  onRequestRoleUpgrade,
  isRepairingTeam,
  onRepairTeam,
  children
}: TeamMembersProps) {
  // Format the onInviteMember callback to match the expected signature in TeamContent
  const handleInviteMember = (email: string, role: UserRole) => {
    return onInviteMember(email, role);
  };

  const isManager = currentUserRole === 'manager' || currentUserRole === 'owner';
  const isViewerOnly = isMember && currentUserRole === 'viewer';

  return (
    <div className="space-y-4">
      {!isMember && (
        <MembershipAlert
          teamName={teamName}
          isRepairing={isRepairingTeam}
          onRepair={onRepairTeam}
          role={currentUserRole || null}
        />
      )}
      
      {isViewerOnly && (
        <ViewerRoleAlert 
          canUpgrade={canChangeRoles} 
          isUpgrading={isUpgradingRole}
          isRequesting={isRequestingRole}
          onUpgrade={onUpgradeRole}
          onRequest={onRequestRoleUpgrade}
        />
      )}
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Team Members</h2>
        
        {isManager && (
          <div className="flex space-x-2">
            <InviteMemberButton 
              onInvite={(email, role) => onInviteMember(email, role as UserRole)}
              teamId={teamId}
              teams={teams}
            />
          </div>
        )}
      </div>
      
      {children}
      
      <TeamMembersList
        members={members}
        onRemoveMember={onRemoveMember}
        onChangeRole={onChangeRole}
        onResendInvite={async () => {}} // This will be handled by pending invitations
        teamId={teamId}
        isViewOnly={!canChangeRoles}
        isLoading={isLoading}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
