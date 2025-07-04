
import React, { createContext, useContext, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';

export interface UnifiedOrganizationContextType {
  currentOrganization: any;
  userOrganizations: any[];
  switchOrganization: (organizationId: string) => void;
  isLoading: boolean;
  error: string | null;
}

const UnifiedOrganizationContext = createContext<UnifiedOrganizationContextType | undefined>(undefined);

export const useUnifiedOrganization = () => {
  const context = useContext(UnifiedOrganizationContext);
  if (context === undefined) {
    throw new Error('useUnifiedOrganization must be used within a UnifiedOrganizationProvider');
  }
  return context;
};

export const UnifiedOrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sessionData, isLoading, error, getCurrentOrganization, switchOrganization } = useSession();

  // OPTIMIZED: Memoize the context value to prevent unnecessary re-renders
  const contextValue: UnifiedOrganizationContextType = useMemo(() => ({
    currentOrganization: getCurrentOrganization(),
    userOrganizations: sessionData?.organizations || [],
    switchOrganization,
    isLoading,
    error
  }), [sessionData, isLoading, error, getCurrentOrganization, switchOrganization]);

  return (
    <UnifiedOrganizationContext.Provider value={contextValue}>
      {children}
    </UnifiedOrganizationContext.Provider>
  );
};
