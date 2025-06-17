
import { useSession } from '@/contexts/SessionContext';

// This hook provides backward compatibility while redirecting to SessionContext
export const useSupabaseOrganization = () => {
  const { sessionData, isLoading, error, getCurrentOrganization, switchOrganization, refreshSession } = useSession();

  return {
    currentOrganization: getCurrentOrganization(),
    userOrganizations: sessionData?.organizations || [],
    switchOrganization,
    isLoading,
    error,
    refetch: refreshSession
  };
};
