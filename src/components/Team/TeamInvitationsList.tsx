
import { PendingInvitationsList } from './PendingInvitationsList';

interface TeamInvitationsListProps {
  invitations: any[];
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvite: (id: string) => Promise<void>;
  isLoading: boolean;
  isViewOnly?: boolean;
}

export function TeamInvitationsList({
  invitations,
  onResendInvite,
  onCancelInvite,
  isLoading,
  isViewOnly = false
}: TeamInvitationsListProps) {
  return (
    <PendingInvitationsList
      invitations={invitations}
      onResendInvite={onResendInvite}
      onCancelInvite={onCancelInvite}
      isLoading={isLoading}
      isViewOnly={isViewOnly}
    />
  );
}
