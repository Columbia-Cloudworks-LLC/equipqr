
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useSession } from '@/hooks/useSession';

export interface SimpleOrganization {
  id: string;
  name: string;
  plan: 'free' | 'premium';
  memberCount: number;
  maxMembers: number;
  features: string[];
  billingCycle?: 'monthly' | 'yearly';
  nextBillingDate?: string;
  logo?: string;
  backgroundColor?: string;
  userRole: 'owner' | 'admin' | 'member';
  userStatus: 'active' | 'pending' | 'inactive';
}

export interface SimpleOrganizationContextType {
  organizations: SimpleOrganization[];
  userOrganizations: SimpleOrganization[]; // Backward compatibility alias
  currentOrganization: SimpleOrganization | null;
  setCurrentOrganization: (organizationId: string) => void;
  switchOrganization: (organizationId: string) => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const SimpleOrganizationContext = createContext<SimpleOrganizationContextType | undefined>(undefined);

const CURRENT_ORG_STORAGE_KEY = 'equipqr_current_organization';

export const SimpleOrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  
  // Get session context to keep them synchronized
  const sessionContext = useSession();

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

      console.log('🔍 SimpleOrganizationProvider: Fetching organizations for user:', user.id);

      // Get user's organization memberships
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role, status')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (membershipError) {
        console.error('❌ SimpleOrganizationProvider: Error fetching memberships:', membershipError);
        throw membershipError;
      }

      if (!membershipData || membershipData.length === 0) {
        console.log('⚠️ SimpleOrganizationProvider: No organization memberships found');
        return [];
      }

      // Get organization details
      const orgIds = membershipData.map(m => m.organization_id);
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      if (orgError) {
        console.error('❌ SimpleOrganizationProvider: Error fetching organizations:', orgError);
        throw orgError;
      }

      // Combine data
      const orgs: SimpleOrganization[] = (orgData || []).map(org => {
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

      console.log('✅ SimpleOrganizationProvider: Organizations fetched:', orgs);
      return orgs;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  // Auto-select first organization if none selected and organizations are available
  useEffect(() => {
    if (!currentOrganizationId && organizations.length > 0) {
      const firstOrgId = organizations[0].id;
      console.log('🎯 SimpleOrganizationProvider: Auto-selecting first organization:', firstOrgId);
      setCurrentOrganizationId(firstOrgId);
      try {
        localStorage.setItem(CURRENT_ORG_STORAGE_KEY, firstOrgId);
      } catch (error) {
        console.warn('Failed to save current organization to storage:', error);
      }
    }
  }, [currentOrganizationId, organizations]);

  // Validate current organization exists in user's organizations
  useEffect(() => {
    if (currentOrganizationId && organizations.length > 0) {
      const orgExists = organizations.some(org => org.id === currentOrganizationId);
      if (!orgExists) {
        console.warn('⚠️ SimpleOrganizationProvider: Current organization not found in user organizations, resetting');
        const firstOrgId = organizations[0].id;
        setCurrentOrganizationId(firstOrgId);
        try {
          localStorage.setItem(CURRENT_ORG_STORAGE_KEY, firstOrgId);
        } catch (error) {
          console.warn('Failed to save current organization to storage:', error);
        }
      }
    }
  }, [currentOrganizationId, organizations]);

  const setCurrentOrganization = useCallback((organizationId: string) => {
    console.log('🔄 SimpleOrganizationProvider: Setting current organization:', organizationId);
    setCurrentOrganizationId(organizationId);
    try {
      localStorage.setItem(CURRENT_ORG_STORAGE_KEY, organizationId);
    } catch (error) {
      console.warn('Failed to save current organization to storage:', error);
    }
  }, []);

  const switchOrganization = useCallback((organizationId: string) => {
    setCurrentOrganization(organizationId);
    // Also update session context to keep them synchronized
    sessionContext.switchOrganization(organizationId);
  }, [setCurrentOrganization, sessionContext]);

  const currentOrganization = currentOrganizationId 
    ? organizations.find(org => org.id === currentOrganizationId) || null
    : null;

  const refetchData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const contextValue: SimpleOrganizationContextType = {
    organizations,
    userOrganizations: organizations, // Backward compatibility alias
    currentOrganization,
    setCurrentOrganization,
    switchOrganization,
    isLoading,
    error: error?.message || null,
    refetch: refetchData
  };

  return (
    <SimpleOrganizationContext.Provider value={contextValue}>
      {children}
    </SimpleOrganizationContext.Provider>
  );
};
