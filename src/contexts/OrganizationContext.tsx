
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getAllUserOrganizations, UserOrganization } from '@/services/organization/userOrganizations';

interface OrganizationContextType {
  organizations: UserOrganization[];
  selectedOrganization: UserOrganization | null;
  isLoading: boolean;
  error: string | null;
  selectOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizations: [],
  selectedOrganization: null,
  isLoading: false,
  error: null,
  selectOrganization: () => {},
  refreshOrganizations: async () => {},
});

export const useOrganization = () => useContext(OrganizationContext);

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<UserOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const fetchOrganizations = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const orgs = await getAllUserOrganizations(forceRefresh);
      
      console.log('Fetched organizations:', orgs);
      setOrganizations(orgs);
      
      // If no organization is selected yet, select the first one (primary)
      if (!selectedOrganization && orgs.length > 0) {
        const primaryOrg = orgs.find(org => org.is_primary) || orgs[0];
        setSelectedOrganization(primaryOrg);
      } else if (selectedOrganization) {
        // Make sure the selected organization is still in the list
        const stillExists = orgs.some(org => org.id === selectedOrganization.id);
        if (!stillExists && orgs.length > 0) {
          setSelectedOrganization(orgs[0]);
        } else if (stillExists) {
          // Update the selected organization with fresh data
          const updatedOrg = orgs.find(org => org.id === selectedOrganization.id);
          if (updatedOrg) {
            setSelectedOrganization(updatedOrg);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  // Load organizations on mount and when refreshCounter changes
  useEffect(() => {
    fetchOrganizations(refreshCounter > 0);
  }, [refreshCounter]);

  const selectOrganization = (orgId: string) => {
    const org = organizations.find(org => org.id === orgId);
    if (org) {
      setSelectedOrganization(org);
    }
  };

  const refreshOrganizations = async (): Promise<void> => {
    setRefreshCounter(prev => prev + 1);
    return fetchOrganizations(true);
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        selectedOrganization,
        isLoading,
        error,
        selectOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
