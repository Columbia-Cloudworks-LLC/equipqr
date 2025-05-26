
import { useState } from 'react';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TeamMemberRow } from './TeamMemberRow';
import { TeamEmptyState } from './TeamEmptyState';
import { RoleInfoTooltip } from '@/components/ui/RoleInfoTooltip';
import { useAuth } from '@/contexts/AuthContext';

interface UnifiedMember extends TeamMember {
  status: 'active' | 'pending';
  invitation_id?: string;
  invitation_email?: string;
  invitation_role?: string;
}

interface TeamListProps {
  members: UnifiedMember[];
  onRemoveMember: (userId: string) => void;
  onChangeRole: (userId: string, role: UserRole) => void;
  onResendInvite: (id: string) => Promise<void>;
  teamId: string;
  isViewOnly?: boolean;
  currentUserRole?: string;
}

export function TeamList({ 
  members, 
  onRemoveMember, 
  onChangeRole, 
  onResendInvite,
  teamId,
  isViewOnly = false,
  currentUserRole
}: TeamListProps) {
  const [changingRoleFor, setChangingRoleFor] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);
  const { session } = useAuth();
  const currentUserId = session?.user?.id;

  if (!members || members.length === 0) {
    return <TeamEmptyState isEmpty={true} />;
  }

  // Calculate additional props for TeamMemberRow
  const calculateMemberProps = (member: UnifiedMember) => {
    // For pending invitations, never treat as current user
    if (member.status === 'pending') {
      return { 
        isCurrentUser: false, 
        isLastManager: false, 
        canChangeRoles: !isViewOnly && ['manager', 'owner'].includes(currentUserRole || '') 
      };
    }
    
    // Determine if this is the current user by comparing user IDs
    const isCurrentUser = currentUserId && 
      ((member.auth_uid && member.auth_uid === currentUserId) || 
       (member.user_id === currentUserId));
    
    // Check if this is the last manager in the team (only count active members)
    const activeManagers = members.filter(m => m.status === 'active' && m.role === 'manager');
    const isLastManager = member.role === 'manager' && activeManagers.length === 1;
    
    // Determine if roles can be changed
    const canChangeRoles = !isViewOnly && ['manager', 'owner'].includes(currentUserRole || '');
    
    return { isCurrentUser, isLastManager, canChangeRoles };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                Role
                <RoleInfoTooltip type="team" />
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const { isCurrentUser, isLastManager, canChangeRoles } = calculateMemberProps(member);
            
            return (
              <TeamMemberRow
                key={member.id}
                member={member}
                onRemoveMember={onRemoveMember}
                onChangeRole={onChangeRole}
                onResendInvite={onResendInvite}
                isCurrentUser={isCurrentUser}
                isLastManager={isLastManager}
                canChangeRoles={canChangeRoles}
                currentUserRole={currentUserRole}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
