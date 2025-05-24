
import { PendingInvitationsList } from './PendingInvitationsList';
import { InvitationCard } from './InvitationCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface TeamInvitationsListProps {
  invitations: any[];
  onResend: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  isLoading: boolean;
  isViewOnly?: boolean;
  teamId?: string;
  onRefresh?: () => Promise<void>;
}

export function TeamInvitationsList({
  invitations,
  onResend,
  onCancel,
  isLoading,
  isViewOnly = false,
  teamId,
  onRefresh
}: TeamInvitationsListProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Pending Invitations</h3>
      </div>
      
      {/* Mobile card layout */}
      {isMobile ? (
        <div className="space-y-3">
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending invitations.
            </div>
          ) : (
            invitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onResend={onResend}
                onCancel={onCancel}
                isViewOnly={isViewOnly}
              />
            ))
          )}
        </div>
      ) : (
        /* Desktop table layout (existing) */
        <PendingInvitationsList
          invitations={invitations}
          onResendInvite={onResend}
          onCancelInvite={onCancel}
          isLoading={isLoading}
          isViewOnly={isViewOnly}
        />
      )}
    </div>
  );
}
