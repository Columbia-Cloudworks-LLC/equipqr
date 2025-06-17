
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserOrganization } from '@/types/organizationContext';
import { Tables } from '@/integrations/supabase/types';

type OrganizationRow = Tables<'organizations'>;

export const useSupabaseOrganization = () => {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<UserOrganization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserOrganizations = async () => {
    if (!user) {
      console.log('No user found, clearing organizations');
      setUserOrganizations([]);
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching organizations for user:', user.id);
      setError(null);
      setIsLoading(true);
      
      // Use the new secure approach: fetch organization memberships with joined organization data
      const { data, error: fetchError } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          status,
          organizations (
            id,
            name,
            plan,
            member_count,
            max_members,
            features,
            billing_cycle,
            next_billing_date
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (fetchError) {
        console.error('Organization fetch error:', fetchError);
        throw fetchError;
      }

      console.log('Raw organization data:', data);

      if (!data) {
        console.log('No organization data returned');
        setUserOrganizations([]);
        setCurrentOrganization(null);
        setIsLoading(false);
        return;
      }

      // Transform the data to match UserOrganization interface
      const organizations: UserOrganization[] = data
        .filter(item => item.organizations) // Filter out null organizations
        .map(item => {
          const org = item.organizations as OrganizationRow;
          const userOrg: UserOrganization = {
            id: org.id,
            name: org.name,
            plan: org.plan as 'free' | 'premium',
            memberCount: org.member_count,
            maxMembers: org.max_members,
            features: org.features,
            billingCycle: org.billing_cycle as 'monthly' | 'yearly' | undefined,
            nextBillingDate: org.next_billing_date || undefined,
            userRole: item.role as 'owner' | 'admin' | 'member',
            userStatus: item.status as 'active' | 'pending' | 'inactive'
          };
          return userOrg;
        });

      console.log('Transformed organizations:', organizations);
      setUserOrganizations(organizations);
      
      // Set current organization (first one or previously selected)
      if (organizations.length > 0) {
        if (!currentOrganization || !organizations.find(org => org.id === currentOrganization.id)) {
          console.log('Setting current organization to:', organizations[0]);
          setCurrentOrganization(organizations[0]);
        }
      } else {
        console.log('No organizations found, clearing current organization');
        setCurrentOrganization(null);
      }
      
    } catch (err) {
      console.error('Error fetching organizations:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organizations';
      setError(errorMessage);
      
      // If we get a security error, it might be a temporary issue, don't clear existing data
      if (!errorMessage.includes('policy')) {
        setUserOrganizations([]);
        setCurrentOrganization(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrganization = (organizationId: string) => {
    console.log('Switching to organization:', organizationId);
    const organization = userOrganizations.find(org => org.id === organizationId);
    if (organization) {
      setCurrentOrganization(organization);
    } else {
      console.warn('Organization not found in user organizations:', organizationId);
    }
  };

  useEffect(() => {
    console.log('useSupabaseOrganization effect triggered, user:', user?.id);
    fetchUserOrganizations();
  }, [user]);

  // Debug logging
  useEffect(() => {
    console.log('Organization state updated:', {
      currentOrganization: currentOrganization?.id,
      userOrganizationsCount: userOrganizations.length,
      isLoading,
      error
    });
  }, [currentOrganization, userOrganizations, isLoading, error]);

  return {
    currentOrganization,
    userOrganizations,
    switchOrganization,
    isLoading,
    error,
    refetch: fetchUserOrganizations
  };
};
