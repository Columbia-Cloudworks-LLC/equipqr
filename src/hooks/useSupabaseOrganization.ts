
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserOrganization } from '@/types/organizationContext';
import { Tables } from '@/integrations/supabase/types';

type OrganizationRow = Tables<'organizations'>;
type OrganizationMemberRow = Tables<'organization_members'>;

export const useSupabaseOrganization = () => {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<UserOrganization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserOrganizations = async () => {
    if (!user) {
      setUserOrganizations([]);
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Fetch organizations where user is a member
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
        throw fetchError;
      }

      if (!data) {
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
          return {
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
        });

      setUserOrganizations(organizations);
      
      // Set current organization (first one or previously selected)
      if (organizations.length > 0 && !currentOrganization) {
        setCurrentOrganization(organizations[0]);
      }
      
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrganization = (organizationId: string) => {
    const organization = userOrganizations.find(org => org.id === organizationId);
    if (organization) {
      setCurrentOrganization(organization);
    }
  };

  useEffect(() => {
    fetchUserOrganizations();
  }, [user]);

  return {
    currentOrganization,
    userOrganizations,
    switchOrganization,
    isLoading,
    error,
    refetch: fetchUserOrganizations
  };
};
