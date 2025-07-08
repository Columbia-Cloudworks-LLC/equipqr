
// Simple re-export from SessionContext
import React, { createContext, useContext } from 'react';
import { useSession } from './SessionContext';

export interface SimpleOrganizationContextType {
  currentOrganization: any;
  userOrganizations: any[];
  switchOrganization: (organizationId: string) => void;
  isLoading: boolean;
  error: string | null;
}

const SimpleOrganizationContext = createContext<SimpleOrganizationContextType | undefined>(undefined);

export const useSimpleOrganization = () => {
  const { sessionData, isLoading, error, getCurrentOrganization, switchOrganization } = useSession();
  
  return {
    currentOrganization: getCurrentOrganization(),
    userOrganizations: sessionData?.organizations || [],
    switchOrganization,
    isLoading,
    error
  };
};

export const SimpleOrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
