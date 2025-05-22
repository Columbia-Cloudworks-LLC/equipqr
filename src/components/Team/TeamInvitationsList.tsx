
import { PendingInvitationsList } from './PendingInvitationsList';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';

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
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Pending Invitations</h3>
        
        {onRefresh && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="ml-2">Refresh</span>
          </Button>
        )}
      </div>
      
      <PendingInvitationsList
        invitations={invitations}
        onResendInvite={onResend}
        onCancelInvite={onCancel}
        isLoading={isLoading}
        isViewOnly={isViewOnly}
      />
    </div>
  );
}
