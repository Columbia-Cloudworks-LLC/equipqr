
import { useState, useEffect } from 'react';

export function useTeamOperationState(
  teamsError: string | null,
  membersError: string | null,
  membershipError: string | null,
  isTeamsLoading: boolean,
  isMembersLoading: boolean
) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Combine errors from all sources
  useEffect(() => {
    const combinedError = teamsError || membersError || membershipError;
    if (combinedError) {
      setError(combinedError);
    } else {
      setError(null);
    }
  }, [teamsError, membersError, membershipError]);
  
  // Combined loading state
  useEffect(() => {
    setIsLoading(isTeamsLoading || isMembersLoading);
  }, [isTeamsLoading, isMembersLoading]);

  return {
    error,
    isLoading
  };
}
