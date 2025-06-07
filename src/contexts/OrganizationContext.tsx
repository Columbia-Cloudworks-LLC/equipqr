
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getAllUserOrganizations, UserOrganization } from '@/services/organization/userOrganizations';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
  organizations: UserOrganization[];
  selectedOrganization: UserOrganization | null;
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
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
  const { user, isLoading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<UserOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const fetchOrganizations = async (): Promise<UserOrganization[]> => {
    if (!user || authLoading) {
      console.log('OrganizationContext: Skipping fetch - no user or auth loading');
      setOrganizations([]);
      setSelectedOrganization(null);
      setIsReady(true);
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsReady(false);
      
      console.log("OrganizationContext: Fetching organizations for user:", user.id.substring(0, 8) + '...');
      
      const orgs = await getAllUserOrganizations(true);
      
      console.log('OrganizationContext: Fetched organizations:', orgs.length);
      setOrganizations(orgs);
      
      // Handle organization selection
      let orgToSelect: UserOrganization | null = null;
      
      // Check for previously selected organization
      const storedOrgId = localStorage.getItem(SELECTED_ORG_KEY);
      if (storedOrgId) {
        orgToSelect = orgs.find(org => org.id === storedOrgId) || null;
        if (!orgToSelect) {
          localStorage.removeItem(SELECTED_ORG_KEY);
        }
      }
      
      // Fallback to primary organization
      if (!orgToSelect) {
        orgToSelect = orgs.find(org => org.is_primary) || null;
      }
      
      // Fallback to first organization
      if (!orgToSelect && orgs.length > 0) {
        orgToSelect = orgs[0];
      }
      
      // Set the selected organization
      if (orgToSelect) {
        console.log('OrganizationContext: Setting selected organization:', orgToSelect.name);
        setSelectedOrganization(orgToSelect);
        localStorage.setItem(SELECTED_ORG_KEY, orgToSelect.id);
      } else {
        console.log('OrganizationContext: No organizations available');
        setSelectedOrganization(null);
        localStorage.removeItem(SELECTED_ORG_KEY);
      }
      
      setIsReady(true);
      return orgs;
    } catch (error) {
      console.error('OrganizationContext: Error fetching organizations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load organizations');
      
      // Don't show toast for auth-related errors during sign-in flow
      if (!window.location.pathname.includes('/auth')) {
        toast.error("Failed to load organizations");
      }
      
      setIsReady(true);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Load organizations when user changes
  useEffect(() => {
    console.log('OrganizationContext: User or auth state changed:', {
      hasUser: !!user,
      authLoading,
      userId: user?.id.substring(0, 8) + '...' || 'none'
    });

    if (user && !authLoading) {
      fetchOrganizations();
    } else if (!user && !authLoading) {
      // User signed out, clear state
      console.log('OrganizationContext: User signed out, clearing state');
      setOrganizations([]);
      setSelectedOrganization(null);
      setIsReady(true);
      setIsLoading(false);
      setError(null);
    }
  }, [user, authLoading]);

  const selectOrganization = (orgId: string) => {
    console.log('OrganizationContext: Selecting organization:', orgId);
    const org = organizations.find(org => org.id === orgId);
    if (org) {
      setSelectedOrganization(org);
      localStorage.setItem(SELECTED_ORG_KEY, orgId);
    } else {
      console.warn(`OrganizationContext: Attempted to select non-existent organization: ${orgId}`);
    }
  };

  const refreshOrganizations = async (): Promise<void> => {
    console.log('OrganizationContext: Refreshing organizations...');
    await fetchOrganizations();
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
