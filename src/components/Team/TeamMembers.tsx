
import { TeamMembersList } from './TeamMembersList';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/supabase-enums';
import { InviteMemberButton } from './InviteMemberButton';
import { ViewerRoleAlert } from './ViewerRoleAlert';
import { RepairTeamAccess } from './RepairTeamAccess';
import { MembershipAlert } from './MembershipAlert';
import { UserPlus } from 'lucide-react';
import { Team } from '@/services/team';
import { useUnifiedTeamMembers } from '@/hooks/team/useUnifiedTeamMembers';

interface TeamMembersProps {
  teamId: string;
  teamName: string;
  members: any[];
  pendingInvitations: any[];
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
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvitation: (id: string) => Promise<void>;
  children?: React.ReactNode;
}

export function TeamMembers({
  teamId,
  teamName,
  members,
  pendingInvitations,
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
  onResendInvite,
  onCancelInvitation,
  children
}: TeamMembersProps) {
  // Use the unified members hook to merge active members and pending invitations
  const unifiedMembers = useUnifiedTeamMembers({ members, pendingInvitations });

  // Handle remove member - need to distinguish between canceling invitations and removing members
  const handleRemoveMember = async (id: string) => {
    // Check if this is a pending invitation
    const member = unifiedMembers.find(m => m.id === id);
    if (member?.status === 'pending' && member.invitation_id) {
      await onCancelInvitation(member.invitation_id);
    } else {
      await onRemoveMember(id);
    }
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
        <div>
          <h2 className="text-xl font-semibold">Team Members</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {unifiedMembers.filter(m => m.status === 'active').length} active members, {' '}
            {unifiedMembers.filter(m => m.status === 'pending').length} pending invitations
          </p>
        </div>
        
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
        members={unifiedMembers}
        onRemoveMember={handleRemoveMember}
        onChangeRole={onChangeRole}
        onResendInvite={onResendInvite}
        teamId={teamId}
        isViewOnly={!canChangeRoles}
        isLoading={isLoading}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
