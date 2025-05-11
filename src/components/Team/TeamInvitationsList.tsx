
import { PendingInvitationsList } from './PendingInvitationsList';

interface TeamInvitationsListProps {
  invitations: any[];
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvite: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function TeamInvitationsList({
  invitations,
  onResendInvite,
  onCancelInvite,
  isLoading
}: TeamInvitationsListProps) {
  return (
    <PendingInvitationsList
      invitations={invitations}
      onResendInvite={onResendInvite}
      onCancelInvite={onCancelInvite}
      isLoading={isLoading}
    />
  );
}
