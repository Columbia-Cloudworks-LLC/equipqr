
import { useState } from 'react';
import { Button } from '../ui/button';
import { TeamMembersList } from './TeamMembersList';
import { InviteForm } from './InviteForm';
import { PendingInvitationsList } from './PendingInvitationsList';
import { UserPlus, RefreshCw, Users } from 'lucide-react';
import { UserRole } from '@/types/supabase-enums';
import { ReactNode } from 'react';

interface TeamMembersProps {
  members: any[];
  pendingInvitations?: any[];
  isLoading: boolean;
  isLoadingInvitations?: boolean;
  teamId: string;
  teamName?: string;
  onInviteMember?: (email: string, role: string, teamId: string) => void;
  onChangeRole?: (id: string, role: string, teamId: string) => void;
  onRemoveMember?: (id: string, teamId: string) => void;
  onResendInvite?: (id: string) => Promise<void>;
  onCancelInvitation?: (id: string) => Promise<void>;
  onFetchPendingInvitations?: () => void;
  currentUserRole?: string;
  canChangeRoles?: boolean;
  isMember?: boolean;
  isUpgradingRole?: boolean;
  isRequestingRole?: boolean;
  onUpgradeRole?: (teamId: string) => Promise<void>;
  onRequestRoleUpgrade?: (teamId: string) => Promise<void>;
  isRepairingTeam?: boolean;
  onRepairTeam?: (teamId: string) => Promise<void>;
  children?: ReactNode;
}

export function TeamMembers({
  members,
  pendingInvitations = [],
  isLoading,
  isLoadingInvitations = false,
  teamId,
  teamName,
  onInviteMember,
  onChangeRole,
  onRemoveMember,
  onResendInvite,
  onCancelInvitation,
  onFetchPendingInvitations,
  currentUserRole,
  canChangeRoles = false,
  isMember = true,
  isUpgradingRole = false,
  isRequestingRole = false,
  onUpgradeRole,
  onRequestRoleUpgrade,
  isRepairingTeam = false,
  onRepairTeam,
  children,
}: TeamMembersProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  
  // Can update members if role is manager or above
  const canManageMembers = currentUserRole === 'manager' || 
                           currentUserRole === 'owner' || 
                           canChangeRoles;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-medium">Team Members</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {canManageMembers && onInviteMember && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInviteForm(!showInviteForm)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {showInviteForm ? 'Cancel' : 'Invite Member'}
            </Button>
          )}
          
          {onFetchPendingInvitations && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFetchPendingInvitations}
              disabled={isLoadingInvitations}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingInvitations ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          )}
        </div>
      </div>
      
      {showInviteForm && canManageMembers && onInviteMember && (
        <InviteForm
          onInvite={(email, role) => {
            onInviteMember(email, role, teamId);
            setShowInviteForm(false);
          }}
          onCancel={() => setShowInviteForm(false)}
          teams={[{ id: teamId, name: teamName || "Current Team" }]}
        />
      )}
      
      <div className="space-y-4">
        {children}
        
        {pendingInvitations && pendingInvitations.length > 0 && onCancelInvitation && onResendInvite && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Pending Invitations</h4>
            <PendingInvitationsList
              invitations={pendingInvitations}
              onResendInvite={onResendInvite}
              onCancelInvite={onCancelInvitation}
              isLoading={isLoadingInvitations}
              isViewOnly={!canManageMembers}
            />
          </div>
        )}
      </div>
    </div>
  );
}
