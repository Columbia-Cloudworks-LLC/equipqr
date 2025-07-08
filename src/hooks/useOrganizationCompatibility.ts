
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';

// Backward compatibility layer for existing organization hooks
export const useSupabaseOrganization = () => {
  const { currentOrganization, userOrganizations, switchOrganization, isLoading, error } = useSimpleOrganization();

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
  const { currentOrganization, userOrganizations, switchOrganization, isLoading, error } = useSimpleOrganization();

  return {
    currentOrganization,
    userOrganizations,
    switchOrganization,
    isLoading,
    error
  };
};
