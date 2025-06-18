
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';

// Backward compatibility layer for existing organization hooks
export const useSupabaseOrganization = () => {
  const { currentOrganization, userOrganizations, switchOrganization, isLoading, error } = useUnifiedOrganization();

  return {
    currentOrganization,
    userOrganizations,
    switchOrganization,
    isLoading,
    error,
    refetch: () => Promise.resolve() // Placeholder for refetch functionality
  };
};

export const useOrganization = () => {
  const { currentOrganization, userOrganizations, switchOrganization, isLoading, error } = useUnifiedOrganization();

  return {
    currentOrganization,
    userOrganizations,
    switchOrganization,
    isLoading,
    error
  };
};
