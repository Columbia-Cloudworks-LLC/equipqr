
import { TeamList } from './TeamList';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';

interface TeamMembersListProps {
  members: TeamMember[];
  onRemoveMember: (id: string, teamId: string) => void;
  onChangeRole: (id: string, role: UserRole, teamId: string) => void;
  onResendInvite: (id: string) => Promise<void>;
  teamId: string;
}

export function TeamMembersList({
  members,
  onRemoveMember,
  onChangeRole,
  onResendInvite,
  teamId
}: TeamMembersListProps) {
  return (
    <TeamList
      members={members}
      onRemoveMember={onRemoveMember}
      onChangeRole={onChangeRole}
      onResendInvite={onResendInvite}
      teamId={teamId}
    />
  );
}
