
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getAllUserOrganizations, UserOrganization } from '@/services/organization/userOrganizations';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
  organizations: UserOrganization[];
  selectedOrganization: UserOrganization | null;
  isLoading: boolean;
  error: string | null;
  isReady: boolean; // New flag to indicate when context is fully loaded
  selectOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizations: [],
  selectedOrganization: null,
  isLoading: false,
  error: null,
  isReady: false,
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
  const [isReady, setIsReady] = useState(false);

  const fetchOrganizations = async (): Promise<UserOrganization[]> => {
    try {
      setIsLoading(true);
      setError(null);
      setIsReady(false);
      
      console.log("OrganizationContext: Fetching organizations...");
      
      if (!user) {
        console.log('OrganizationContext: No user, setting ready state');
        setOrganizations([]);
        setSelectedOrganization(null);
        setIsReady(true);
        return [];
      }
      
      // Always force refresh when explicitly called
      const orgs = await getAllUserOrganizations(true);
      
      console.log('OrganizationContext: Fetched organizations:', orgs);
      setOrganizations(orgs);
      
      // Ensure we always have a selected organization if any exist
      let orgToSelect: UserOrganization | null = null;
      
      // Check localStorage for previously selected organization
      const storedOrgId = localStorage.getItem(SELECTED_ORG_KEY);
      if (storedOrgId) {
        orgToSelect = orgs.find(org => org.id === storedOrgId) || null;
        if (!orgToSelect) {
          // Remove invalid stored selection
          localStorage.removeItem(SELECTED_ORG_KEY);
        }
      }
      
      // Fallback to primary organization if no valid stored selection
      if (!orgToSelect) {
        orgToSelect = orgs.find(org => org.is_primary) || null;
      }
      
      // Fallback to the first organization in the list
      if (!orgToSelect && orgs.length > 0) {
        orgToSelect = orgs[0];
      }
      
      // Set the selected organization and persist the choice
      if (orgToSelect) {
        console.log('OrganizationContext: Setting selected organization:', orgToSelect);
        setSelectedOrganization(orgToSelect);
        localStorage.setItem(SELECTED_ORG_KEY, orgToSelect.id);
      } else {
        // No organizations available
        setSelectedOrganization(null);
        localStorage.removeItem(SELECTED_ORG_KEY);
      }
      
      setIsReady(true);
      return orgs;
    } catch (error) {
      console.error('OrganizationContext: Error fetching organizations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load organizations');
      toast.error("Failed to load organizations");
      setIsReady(true);
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
      setIsReady(true);
      setIsLoading(false);
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
        isReady,
        selectOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
