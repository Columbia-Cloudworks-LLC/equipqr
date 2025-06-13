
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { OrganizationContextType, UserOrganization } from '@/types/organizationContext';

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

// Mock data for development - replace with actual API calls
const mockUserOrganizations: UserOrganization[] = [
  {
    id: 'org-1',
    name: 'Acme Fleet Management',
    plan: 'free',
    memberCount: 4,
    maxMembers: 5,
    features: ['Equipment Management', 'Work Orders', 'Team Management'],
    userRole: 'owner',
    userStatus: 'active',
  },
  {
    id: 'org-2',
    name: 'TechCorp Industries',
    plan: 'premium',
    memberCount: 12,
    maxMembers: 50,
    features: ['Equipment Management', 'Work Orders', 'Team Management', 'Fleet Map', 'Advanced Analytics'],
    billingCycle: 'monthly',
    nextBillingDate: '2024-07-15',
    userRole: 'admin',
    userStatus: 'active',
  },
  {
    id: 'org-3',
    name: 'StartupFleet',
    plan: 'free',
    memberCount: 2,
    maxMembers: 5,
    features: ['Equipment Management', 'Work Orders'],
    userRole: 'member',
    userStatus: 'active',
  },
];

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [currentOrganization, setCurrentOrganization] = useState<UserOrganization | null>(null);
  const [userOrganizations] = useState<UserOrganization[]>(mockUserOrganizations);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved organization preference from localStorage
  useEffect(() => {
    try {
      const savedOrgId = localStorage.getItem('equipqr_current_organization');
      if (savedOrgId) {
        const savedOrg = userOrganizations.find(org => org.id === savedOrgId);
        if (savedOrg) {
          setCurrentOrganization(savedOrg);
        } else {
          // If saved org not found, default to first organization
          setCurrentOrganization(userOrganizations[0] || null);
        }
      } else {
        // Default to first organization if no preference saved
        setCurrentOrganization(userOrganizations[0] || null);
      }
    } catch (error) {
      console.error('Error loading organization preference:', error);
      setCurrentOrganization(userOrganizations[0] || null);
    } finally {
      setIsLoading(false);
    }
  }, [userOrganizations]);

  const switchOrganization = (organizationId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const organization = userOrganizations.find(org => org.id === organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      if (organization.userStatus !== 'active') {
        throw new Error('Cannot switch to inactive organization');
      }

      setCurrentOrganization(organization);
      localStorage.setItem('equipqr_current_organization', organizationId);
      
      console.log(`Switched to organization: ${organization.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch organization';
      setError(errorMessage);
      console.error('Error switching organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: OrganizationContextType = {
    currentOrganization,
    userOrganizations,
    switchOrganization,
    isLoading,
    error,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
