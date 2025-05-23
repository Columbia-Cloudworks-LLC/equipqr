
import { TeamList } from './TeamList';
import { TeamMemberCard } from './TeamMemberCard';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

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
  const isMobile = useIsMobile();
  const { session } = useAuth();
  const currentUserId = session?.user?.id;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Mobile card layout
  if (isMobile) {
    if (!members || members.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No team members found.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {members.map((member) => {
          // Calculate member-specific props
          const isCurrentUser = currentUserId && 
            ((member.auth_uid && member.auth_uid === currentUserId) || 
             (member.user_id === currentUserId));
          
          const isLastManager = member.role === 'manager' && 
            members.filter(m => m.role === 'manager').length === 1;
          
          const canChangeRoles = !isViewOnly && ['manager', 'owner'].includes(currentUserRole || '');

          return (
            <TeamMemberCard
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
      </div>
    );
  }
  
  // Desktop table layout (existing)
  return (
    <TeamList
      members={members}
      onRemoveMember={onRemoveMember}
      onChangeRole={onChangeRole}
      onResendInvite={onResendInvite}
      teamId={teamId}
      isViewOnly={isViewOnly}
      currentUserRole={currentUserRole}
    />
  );
}
