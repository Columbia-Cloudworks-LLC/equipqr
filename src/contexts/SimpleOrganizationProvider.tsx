import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { OrganizationSyncService } from '@/services/organizationSyncService';
import { 
  SimpleOrganizationContext, 
  SimpleOrganization, 
  SimpleOrganizationContextType 
} from './SimpleOrganizationContext';

const CURRENT_ORG_STORAGE_KEY = 'equipqr_current_organization';

export const SimpleOrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CURRENT_ORG_STORAGE_KEY);
      if (stored) {
        setCurrentOrganizationId(stored);
      }
    } catch (error) {
      console.warn('Failed to load current organization from storage:', error);
    }
  }, []);

  // Fetch organizations using React Query
  const {
    data: organizations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['simple-organizations', user?.id],
    queryFn: async (): Promise<SimpleOrganization[]> => {
      if (!user) return [];

      // Get user's organization memberships
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role, status')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (membershipError) {
        throw membershipError;
      }

      if (!membershipData || membershipData.length === 0) {
        return [];
      }

      // Get organization details
      const orgIds = membershipData.map(m => m.organization_id);
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      if (orgError) {
        throw orgError;
      }

      // Combine data
      return (orgData || []).map(org => {
        const membership = membershipData.find(m => m.organization_id === org.id);
        return {
          id: org.id,
          name: org.name,
          plan: org.plan as 'free' | 'premium',
          memberCount: org.member_count,
          maxMembers: org.max_members,
          features: org.features,
          billingCycle: org.billing_cycle as 'monthly' | 'yearly' | undefined,
          nextBillingDate: org.next_billing_date || undefined,
          logo: org.logo || undefined,
          backgroundColor: org.background_color || undefined,
          userRole: membership?.role as 'owner' | 'admin' | 'member' || 'member',
          userStatus: membership?.status as 'active' | 'pending' | 'inactive' || 'active'
        };
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  // Helper function to prioritize organizations by user role
  const getPrioritizedOrganization = useMemo(() => (orgs: SimpleOrganization[]): string => {
    if (orgs.length === 0) return '';
    
    // Sort by role priority: owner > admin > member
    const prioritized = [...orgs].sort((a, b) => {
      const roleWeight = { owner: 3, admin: 2, member: 1 };
      return (roleWeight[b.userRole] || 0) - (roleWeight[a.userRole] || 0);
    });
    
    return prioritized[0].id;
  }, []);

  // Listen for organization sync events
  useEffect(() => {
    const handleOrgChange = (event: any) => {
      if (event.source !== 'organization') {
        setCurrentOrganizationId(event.organizationId);
        try {
          localStorage.setItem(CURRENT_ORG_STORAGE_KEY, event.organizationId);
        } catch (error) {
          console.warn('Failed to save organization to storage:', error);
        }
      }
    };

    const handleSessionReady = () => {
      // Auto-select organization when session is ready
      if (!currentOrganizationId && organizations.length > 0) {
        const syncOrgId = OrganizationSyncService.getCurrentOrganizationId();
        
        if (syncOrgId && organizations.find(org => org.id === syncOrgId)) {
          setCurrentOrganizationId(syncOrgId);
          try {
            localStorage.setItem(CURRENT_ORG_STORAGE_KEY, syncOrgId);
          } catch (error) {
            console.warn('Failed to save organization to storage:', error);
          }
          return;
        }

        // Use role-based prioritization
        const prioritizedOrgId = getPrioritizedOrganization(organizations);
        if (prioritizedOrgId) {
          setCurrentOrganizationId(prioritizedOrgId);
          try {
            localStorage.setItem(CURRENT_ORG_STORAGE_KEY, prioritizedOrgId);
          } catch (error) {
            console.warn('Failed to save organization to storage:', error);
          }
          OrganizationSyncService.switchOrganization(prioritizedOrgId, 'organization');
        }
      }
    };

    OrganizationSyncService.on('organization_change', handleOrgChange);
    OrganizationSyncService.on('session_ready', handleSessionReady);

    return () => {
      OrganizationSyncService.off('organization_change', handleOrgChange);
      OrganizationSyncService.off('session_ready', handleSessionReady);
    };
  }, [currentOrganizationId, organizations, getPrioritizedOrganization]);

  // Validate current organization exists in user's organizations
  useEffect(() => {
    if (currentOrganizationId && organizations.length > 0) {
      const orgExists = organizations.some(org => org.id === currentOrganizationId);
      if (!orgExists) {
        const prioritizedOrgId = getPrioritizedOrganization(organizations);
        if (prioritizedOrgId) {
          setCurrentOrganizationId(prioritizedOrgId);
          try {
            localStorage.setItem(CURRENT_ORG_STORAGE_KEY, prioritizedOrgId);
          } catch (error) {
            console.warn('Failed to save organization to storage:', error);
          }
          OrganizationSyncService.switchOrganization(prioritizedOrgId, 'organization');
        }
      }
    }
  }, [currentOrganizationId, organizations, getPrioritizedOrganization]);

  const setCurrentOrganization = useCallback((organizationId: string) => {
    setCurrentOrganizationId(organizationId);
    try {
      localStorage.setItem(CURRENT_ORG_STORAGE_KEY, organizationId);
    } catch (error) {
      console.warn('Failed to save organization to storage:', error);
    }
    OrganizationSyncService.switchOrganization(organizationId, 'organization');
  }, []);

  const switchOrganization = useCallback((organizationId: string) => {
    setCurrentOrganization(organizationId);
  }, [setCurrentOrganization]);

  const currentOrganization = useMemo(() => 
    currentOrganizationId 
      ? organizations.find(org => org.id === currentOrganizationId) || null
      : null,
    [currentOrganizationId, organizations]
  );

  const refetchData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const contextValue: SimpleOrganizationContextType = useMemo(() => ({
    organizations,
    userOrganizations: organizations, // Backward compatibility alias
    currentOrganization,
    setCurrentOrganization,
    switchOrganization,
    isLoading,
    error: error?.message || null,
    refetch: refetchData
  }), [
    organizations,
    currentOrganization,
    setCurrentOrganization,
    switchOrganization,
    isLoading,
    error,
    refetchData
  ]);

  return (
    <SimpleOrganizationContext.Provider value={contextValue}>
      {children}
    </SimpleOrganizationContext.Provider>
  );
};
