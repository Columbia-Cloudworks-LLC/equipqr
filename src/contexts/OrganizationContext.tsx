
import React, { createContext, useContext } from 'react';
import { OrganizationContextType } from '@/types/organizationContext';
import { useSupabaseOrganization } from '@/hooks/useSupabaseOrganization';

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const organizationData = useSupabaseOrganization();

  return (
    <OrganizationContext.Provider value={organizationData}>
      {children}
    </OrganizationContext.Provider>
  );
};
