
import { InvitationType } from '@/types/invitations';

export interface InvitationState {
  isRateLimited: boolean;
  retryCount: number;
  lastAttemptType: InvitationType | null;
}
