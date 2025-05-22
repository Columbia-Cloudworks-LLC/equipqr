
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
import { TeamListHeader } from './TeamListHeader';
import { TeamEmptyState } from './TeamEmptyState';

interface TeamListProps {
  members: TeamMember[];
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

  if (!members || members.length === 0) {
    return <TeamEmptyState isEmpty={true} />;
  }

  // Calculate additional props for TeamMemberRow
  const calculateMemberProps = (member: TeamMember) => {
    // Determine if this is the current user
    const isCurrentUser = member.role === currentUserRole;
    
    // Check if this is the last manager in the team
    const isLastManager = member.role === 'manager' && 
      members.filter(m => m.role === 'manager').length === 1;
    
    // Determine if roles can be changed
    const canChangeRoles = !isViewOnly && ['manager', 'owner'].includes(currentUserRole || '');
    
    return { isCurrentUser, isLastManager, canChangeRoles };
  };

  return (
    <div className="rounded-md border">
      <TeamListHeader isViewOnly={isViewOnly} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
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
