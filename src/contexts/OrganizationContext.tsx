
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getAllUserOrganizations, UserOrganization } from '@/services/organization/userOrganizations';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
  organizations: UserOrganization[];
  selectedOrganization: UserOrganization | null;
  defaultOrganizationId: string | null;
  isLoading: boolean;
  error: string | null;
  selectOrganization: (orgId: string) => void;
  setDefaultOrganization: (orgId: string) => Promise<boolean>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizations: [],
  selectedOrganization: null,
  defaultOrganizationId: null,
  isLoading: false,
  error: null,
  selectOrganization: () => {},
  setDefaultOrganization: async () => false,
  refreshOrganizations: async () => {},
});

export const useOrganization = () => useContext(OrganizationContext);

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<UserOrganization | null>(null);
  const [defaultOrganizationId, setDefaultOrganizationId] = useState<string | null>(null);
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
      
      // Get user's default organization from profile
      if (user?.id) {
        const { data: defaultOrgData, error: defaultOrgError } = await supabase
          .rpc('get_user_default_org', { user_id_param: user.id });
        
        if (!defaultOrgError && defaultOrgData) {
          console.log('OrganizationContext: Default organization ID:', defaultOrgData);
          setDefaultOrganizationId(defaultOrgData);
          
          // Find the default org in our list
          const defaultOrg = orgs.find(org => org.id === defaultOrgData);
          if (defaultOrg) {
            setSelectedOrganization(defaultOrg);
            return orgs;
          }
        } else if (defaultOrgError) {
          console.error('Error fetching default organization:', defaultOrgError);
        }
      }
      
      // If no default organization is set, look for a primary one
      const primaryOrg = orgs.find(org => org.is_primary);
      if (primaryOrg) {
        console.log('OrganizationContext: Using primary organization:', primaryOrg);
        setSelectedOrganization(primaryOrg);
        return orgs;
      }
      
      // Fallback to the first organization in the list
      if (orgs.length > 0 && !selectedOrganization) {
        console.log('OrganizationContext: Using first available organization:', orgs[0]);
        setSelectedOrganization(orgs[0]);
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
      setDefaultOrganizationId(null);
    }
  }, [refreshCounter, user]);

  const selectOrganization = (orgId: string) => {
    console.log('OrganizationContext: Selecting organization:', orgId);
    const org = organizations.find(org => org.id === orgId);
    if (org) {
      setSelectedOrganization(org);
    } else {
      console.warn(`OrganizationContext: Attempted to select non-existent organization: ${orgId}`);
    }
  };

  const setDefaultOrganization = async (orgId: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await supabase
        .rpc('set_user_default_org', { 
          user_id_param: user.id, 
          org_id_param: orgId 
        });
      
      if (error) {
        console.error('Error setting default organization:', error);
        toast.error('Failed to set default organization');
        return false;
      }
      
      if (data) {
        setDefaultOrganizationId(orgId);
        toast.success('Default organization updated');
        return true;
      } else {
        toast.error('Could not set default organization');
        return false;
      }
    } catch (error) {
      console.error('Error in setDefaultOrganization:', error);
      toast.error('An error occurred setting default organization');
      return false;
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
        defaultOrganizationId,
        isLoading,
        error,
        selectOrganization,
        setDefaultOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
