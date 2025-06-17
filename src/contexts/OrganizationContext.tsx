
import React, { createContext, useContext } from 'react';
import { OrganizationContextType } from '@/types/organizationContext';
import { useSession } from '@/contexts/SessionContext';

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sessionData, isLoading, error, getCurrentOrganization, switchOrganization } = useSession();

  const organizationData: OrganizationContextType = {
    currentOrganization: getCurrentOrganization(),
    userOrganizations: sessionData?.organizations || [],
    switchOrganization,
    isLoading,
    error
  };

  return (
    <OrganizationContext.Provider value={organizationData}>
      {children}
    </OrganizationContext.Provider>
  );
};
