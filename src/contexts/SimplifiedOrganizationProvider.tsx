import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useSession } from '@/hooks/useSession';
import { 
  SimpleOrganizationContext, 
  SimpleOrganization, 
  SimpleOrganizationContextType 
} from './SimpleOrganizationContext';

const CURRENT_ORG_STORAGE_KEY = 'equipqr_current_organization';

export const SimpleOrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Safely access session context - it may not be available during initialization
  let sessionData = null;
  let sessionSwitchOrg = (organizationId: string) => {
    // Fallback function - save to localStorage only
    try {
      localStorage.setItem(CURRENT_ORG_STORAGE_KEY, organizationId);
    } catch (error) {
      console.warn('Failed to save organization to storage:', error);
    }
  };
  
  try {
    const session = useSession();
    sessionData = session.sessionData;
    sessionSwitchOrg = session.switchOrganization;
  } catch (error) {
    // SessionProvider not yet available - this is expected during initialization
    console.log('Session context not yet available, using fallback');
  }

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

  // Get current organization from session data (read-only)
  const currentOrganization = useMemo(() => {
    if (!sessionData?.currentOrganizationId) return null;
    return organizations.find(org => org.id === sessionData.currentOrganizationId) || null;
  }, [sessionData?.currentOrganizationId, organizations]);

  // Delegate organization switching to SessionContext
  const setCurrentOrganization = useCallback((organizationId: string) => {
    sessionSwitchOrg(organizationId);
    // Also save to localStorage for immediate feedback
    try {
      localStorage.setItem(CURRENT_ORG_STORAGE_KEY, organizationId);
    } catch (error) {
      console.warn('Failed to save organization to storage:', error);
    }
  }, [sessionSwitchOrg]);

  const switchOrganization = useCallback((organizationId: string) => {
    setCurrentOrganization(organizationId);
  }, [setCurrentOrganization]);

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