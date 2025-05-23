
import { useState } from 'react';
import { InvitationType } from '@/types/invitations';

export function useInvitationState() {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastAttemptType, setLastAttemptType] = useState<InvitationType | null>(null);
  
  return {
    isRateLimited,
    setIsRateLimited,
    retryCount,
    setRetryCount,
    lastAttemptType,
    setLastAttemptType
  };
}
