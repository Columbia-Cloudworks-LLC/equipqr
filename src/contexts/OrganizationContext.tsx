
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getAllUserOrganizations, UserOrganization } from '@/services/organization/userOrganizations';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

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

const SELECTED_ORG_KEY = 'equipqr_selected_organization';

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<UserOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const fetchOrganizations = async (): Promise<UserOrganization[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("OrganizationContext: Fetching organizations...");
      
      if (!user) {
        console.log('OrganizationContext: No user, skipping org fetch');
        return [];
      }
      
      // Always force refresh when explicitly called
      const orgs = await getAllUserOrganizations(true);
      
      console.log('OrganizationContext: Fetched organizations:', orgs);
      setOrganizations(orgs);
      
      // Check localStorage for previously selected organization
      const storedOrgId = localStorage.getItem(SELECTED_ORG_KEY);
      if (storedOrgId) {
        const storedOrg = orgs.find(org => org.id === storedOrgId);
        if (storedOrg) {
          console.log('OrganizationContext: Using stored organization:', storedOrg);
          setSelectedOrganization(storedOrg);
          return orgs;
        } else {
          // Remove invalid stored selection
          localStorage.removeItem(SELECTED_ORG_KEY);
        }
      }
      
      // Fallback to primary organization if no valid stored selection
      const primaryOrg = orgs.find(org => org.is_primary);
      if (primaryOrg) {
        console.log('OrganizationContext: Using primary organization:', primaryOrg);
        setSelectedOrganization(primaryOrg);
        localStorage.setItem(SELECTED_ORG_KEY, primaryOrg.id);
        return orgs;
      }
      
      // Fallback to the first organization in the list
      if (orgs.length > 0 && !selectedOrganization) {
        console.log('OrganizationContext: Using first available organization:', orgs[0]);
        setSelectedOrganization(orgs[0]);
        localStorage.setItem(SELECTED_ORG_KEY, orgs[0].id);
      } else if (selectedOrganization) {
        // Make sure the selected organization is still in the list
        const stillExists = orgs.some(org => org.id === selectedOrganization.id);
        if (!stillExists && orgs.length > 0) {
          setSelectedOrganization(orgs[0]);
          localStorage.setItem(SELECTED_ORG_KEY, orgs[0].id);
        } else if (stillExists) {
          // Update the selected organization with fresh data
          const updatedOrg = orgs.find(org => org.id === selectedOrganization.id);
          if (updatedOrg) {
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

  // Load organizations when user changes or refresh is triggered
  useEffect(() => {
    if (user) {
      fetchOrganizations();
    } else {
      // Reset state when user is not available
      setOrganizations([]);
      setSelectedOrganization(null);
    }
  }, [refreshCounter, user]);

  const selectOrganization = (orgId: string) => {
    console.log('OrganizationContext: Selecting organization:', orgId);
    const org = organizations.find(org => org.id === orgId);
    if (org) {
      setSelectedOrganization(org);
      // Persist selection to localStorage
      localStorage.setItem(SELECTED_ORG_KEY, orgId);
    } else {
      console.warn(`OrganizationContext: Attempted to select non-existent organization: ${orgId}`);
    }
  };

  const refreshOrganizations = async (): Promise<void> => {
    console.log('OrganizationContext: Refreshing organizations...');
    setRefreshCounter(prev => prev + 1);
    // Actually wait for the fetch to complete
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
