
import { useState, useEffect } from 'react';
import { UserOrganization } from '@/types/organizationContext';

// DEPRECATED: This hook has been replaced by SessionContext for better performance
// Use useSession() from @/contexts/SessionContext instead
export const useSupabaseOrganization = () => {
  console.warn('useSupabaseOrganization is deprecated. Use SessionContext instead.');
  
  return {
    currentOrganization: null,
    userOrganizations: [],
    switchOrganization: () => {},
    isLoading: false,
    error: 'This hook is deprecated. Use SessionContext instead.',
    refetch: async () => {}
  };
};
