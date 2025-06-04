
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
  isSessionReady: boolean; // New flag to indicate session readiness
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizations: [],
  selectedOrganization: null,
  isLoading: false,
  error: null,
  isReady: false,
  selectOrganization: () => {},
  refreshOrganizations: async () => {},
  isSessionReady: false,
});

export const useOrganization = () => useContext(OrganizationContext);

interface OrganizationProviderProps {
  children: ReactNode;
}

const SELECTED_ORG_KEY = 'equipqr_selected_organization';

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { user, session, checkSession } = useAuth();
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<UserOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [sessionCheckAttempts, setSessionCheckAttempts] = useState(0);

  // Monitor session readiness
  useEffect(() => {
    const checkSessionReadiness = async () => {
      if (!user || !session) {
        setIsSessionReady(false);
        return;
      }

      try {
        const isValidSession = await checkSession();
        if (isValidSession) {
          console.log('OrganizationContext: Session is ready');
          setIsSessionReady(true);
          setSessionCheckAttempts(0);
        } else if (sessionCheckAttempts < 3) {
          console.log(`OrganizationContext: Session not ready, attempt ${sessionCheckAttempts + 1}`);
          setSessionCheckAttempts(prev => prev + 1);
          // Retry after a delay
          setTimeout(checkSessionReadiness, 1000 * (sessionCheckAttempts + 1));
        } else {
          console.error('OrganizationContext: Session failed to become ready after retries');
          setError('Authentication session is not ready. Please try refreshing the page.');
          setIsReady(true);
        }
      } catch (error) {
        console.error('OrganizationContext: Error checking session readiness:', error);
        setError('Failed to verify session. Please try signing in again.');
        setIsReady(true);
      }
    };

    if (user && session) {
      checkSessionReadiness();
    } else {
      setIsSessionReady(false);
    }
  }, [user, session, checkSession, sessionCheckAttempts]);

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

      if (!isSessionReady) {
        console.log('OrganizationContext: Session not ready, skipping fetch');
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
    } catch (error: any) {
      console.error('OrganizationContext: Error fetching organizations:', error);
      
      // More specific error handling
      if (error.message?.includes('Authentication session not available')) {
        setError('Please sign in to continue.');
      } else if (error.message?.includes('Failed to fetch user roles')) {
        setError('Failed to load your organization access. Please try again.');
      } else {
        setError(error instanceof Error ? error.message : 'Failed to load organizations');
      }
      
      // Only show toast for unexpected errors, not auth-related ones
      if (!error.message?.includes('Authentication session')) {
        toast.error("Failed to load organizations");
      }
      
      setIsReady(true);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Load organizations when session becomes ready
  useEffect(() => {
    if (isSessionReady && user) {
      fetchOrganizations();
    } else if (!user) {
      // Reset state when user is not available
      setOrganizations([]);
      setSelectedOrganization(null);
      setIsReady(true);
      setIsLoading(false);
      setError(null);
    }
  }, [isSessionReady, user, refreshCounter]);

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
        isSessionReady,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
