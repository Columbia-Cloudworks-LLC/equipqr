
import { TeamList } from './TeamList';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';

interface TeamMembersListProps {
  members: TeamMember[];
  onRemoveMember: (id: string) => void;
  onChangeRole: (id: string, role: UserRole) => void;
  onResendInvite: (id: string) => Promise<void>;
  teamId: string;
  isViewOnly?: boolean;
  isLoading?: boolean;
  currentUserRole?: string;
}

export function TeamMembersList({
  members,
  onRemoveMember,
  onChangeRole,
  onResendInvite,
  teamId,
  isViewOnly = false,
  isLoading = false,
  currentUserRole
}: TeamMembersListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Create adapter functions that convert the function signatures
  const handleRemoveMember = (userId: string) => {
    onRemoveMember(userId);
  };
  
  const handleChangeRole = (userId: string, role: UserRole) => {
    onChangeRole(userId, role);
  };
  
  return (
    <TeamList
      members={members}
      onRemoveMember={handleRemoveMember}
      onChangeRole={handleChangeRole}
      onResendInvite={onResendInvite}
      teamId={teamId}
      isViewOnly={isViewOnly}
      currentUserRole={currentUserRole}
    />
  );
}
