
import { useEffect } from 'react';

/**
 * Hook to store invitation details in session storage for post-authentication redirection
 */
export function useInvitationStorage(token: string | undefined, invitationType: string, searchParams: URLSearchParams | null, user: any) {
  useEffect(() => {
    if (!user && token) {
      // Save the invitation path for redirection after login
      const typeParam = invitationType === 'organization' ? '?type=organization' : '';
      const invitationPath = `/invitation/${token}${typeParam}${typeParam ? '&' : '?'}${searchParams?.toString() || ''}`;
      
      sessionStorage.setItem('invitationPath', invitationPath);
      sessionStorage.setItem('invitationType', invitationType);
      console.log('Saved invitation path for after login:', invitationPath);
    }
  }, [user, token, searchParams, invitationType]);
}
