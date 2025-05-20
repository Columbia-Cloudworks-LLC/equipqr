
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getAllUserOrganizations, UserOrganization } from '@/services/organization/userOrganizations';
import { toast } from 'sonner';

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

  // Fix: Change the return type to Promise<UserOrganization[]> to match what we're returning
  const fetchOrganizations = async (): Promise<UserOrganization[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("OrganizationContext: Fetching organizations...");
      // Always force refresh when explicitly called
      const orgs = await getAllUserOrganizations(true);
      
      console.log('OrganizationContext: Fetched organizations:', orgs);
      setOrganizations(orgs);
      
      // If no organization is selected yet, select the first one (primary)
      if (!selectedOrganization && orgs.length > 0) {
        const primaryOrg = orgs.find(org => org.is_primary) || orgs[0];
        console.log('OrganizationContext: Setting primary organization:', primaryOrg);
        setSelectedOrganization(primaryOrg);
      } else if (selectedOrganization) {
        // Make sure the selected organization is still in the list
        const stillExists = orgs.some(org => org.id === selectedOrganization.id);
        if (!stillExists && orgs.length > 0) {
          console.log('OrganizationContext: Selected organization no longer exists, selecting first available');
          setSelectedOrganization(orgs[0]);
        } else if (stillExists) {
          // Update the selected organization with fresh data
          const updatedOrg = orgs.find(org => org.id === selectedOrganization.id);
          if (updatedOrg) {
            console.log('OrganizationContext: Updating selected organization with fresh data');
            setSelectedOrganization(updatedOrg);
          }
        }
      }
      
      return orgs;
    } catch (error) {
      console.error('OrganizationContext: Error fetching organizations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load organizations');
      toast.error("Failed to load organizations");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Load organizations on mount and when refreshCounter changes
  useEffect(() => {
    fetchOrganizations();
  }, [refreshCounter]);

  const selectOrganization = (orgId: string) => {
    console.log('OrganizationContext: Selecting organization:', orgId);
    const org = organizations.find(org => org.id === orgId);
    if (org) {
      setSelectedOrganization(org);
    } else {
      console.warn(`OrganizationContext: Attempted to select non-existent organization: ${orgId}`);
    }
  };

  const refreshOrganizations = async (): Promise<void> => {
    console.log('OrganizationContext: Refreshing organizations...');
    setRefreshCounter(prev => prev + 1);
    // Actually wait for the fetch to complete but don't return the organizations since the return type is Promise<void>
    await fetchOrganizations();
    return;
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
