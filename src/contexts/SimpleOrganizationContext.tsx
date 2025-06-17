
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUserOrganizations, useCurrentOrganization, Organization } from '@/hooks/useOrganizations';

interface SimpleOrganizationContextType {
  currentOrganization: Organization | null;
  userOrganizations: Organization[];
  switchOrganization: (organizationId: string) => void;
  isLoading: boolean;
}

const SimpleOrganizationContext = createContext<SimpleOrganizationContextType | undefined>(undefined);

export const useSimpleOrganization = () => {
  const context = useContext(SimpleOrganizationContext);
  if (context === undefined) {
    throw new Error('useSimpleOrganization must be used within a SimpleOrganizationProvider');
  }
  return context;
};

export const SimpleOrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  
  const { data: userOrganizations = [], isLoading } = useUserOrganizations();
  const currentOrganization = useCurrentOrganization(selectedOrgId || undefined);

  // Initialize organization selection
  useEffect(() => {
    const orgIdFromUrl = searchParams.get('org');
    
    if (orgIdFromUrl && userOrganizations.find(org => org.id === orgIdFromUrl)) {
      setSelectedOrgId(orgIdFromUrl);
    } else if (userOrganizations.length > 0 && !selectedOrgId) {
      // Auto-select first organization if none selected
      const firstOrgId = userOrganizations[0].id;
      setSelectedOrgId(firstOrgId);
      setSearchParams(prev => {
        prev.set('org', firstOrgId);
        return prev;
      });
    }
  }, [userOrganizations, searchParams, selectedOrgId, setSearchParams]);

  const switchOrganization = (organizationId: string) => {
    setSelectedOrgId(organizationId);
    setSearchParams(prev => {
      prev.set('org', organizationId);
      return prev;
    });
  };

  return (
    <SimpleOrganizationContext.Provider value={{
      currentOrganization,
      userOrganizations,
      switchOrganization,
      isLoading
    }}>
      {children}
    </SimpleOrganizationContext.Provider>
  );
};
