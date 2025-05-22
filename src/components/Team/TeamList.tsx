
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
  onResendInvite: (id: string) => void;
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

  // Create wrapper functions that match the expected signatures
  const handleRemoveMember = (userId: string) => {
    onRemoveMember(userId);
  };

  const handleChangeRole = (userId: string, role: UserRole) => {
    onChangeRole(userId, role);
  };

  if (!members || members.length === 0) {
    return <TeamEmptyState isEmpty={true} />;
  }

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
          {members.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              onRemoveMember={handleRemoveMember}
              onChangeRole={handleChangeRole}
              onResendInvite={onResendInvite}
              teamId={teamId}
              isViewOnly={isViewOnly}
              changingRoleFor={changingRoleFor}
              removingMember={removingMember}
              resendingInvite={resendingInvite}
              setChangingRoleFor={setChangingRoleFor}
              setRemovingMember={setRemovingMember}
              setResendingInvite={setResendingInvite}
              currentUserRole={currentUserRole}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
