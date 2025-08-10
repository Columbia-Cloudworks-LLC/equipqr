
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { showErrorToast } from '@/utils/errorHandling';

export interface Organization {
  id: string;
  name: string;
  plan: 'free' | 'premium';
  memberCount: number;
  maxMembers: number;
  features: string[];
  billingCycle?: 'monthly' | 'yearly';
  nextBillingDate?: string;
  userRole: 'owner' | 'admin' | 'member';
  userStatus: 'active' | 'pending' | 'inactive';
}

export const useUserOrganizations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: async (): Promise<Organization[]> => {
      if (!user) return [];

      console.log('🔍 Fetching user organizations for:', user.id);

      // Get user's organization memberships
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role, status')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (membershipError) {
        console.error('❌ Error fetching memberships:', membershipError);
        showErrorToast(membershipError, 'Loading Organization Memberships');
        throw membershipError;
      }

      if (!membershipData || membershipData.length === 0) {
        console.log('⚠️ No organization memberships found');
        return [];
      }

      // Get organization details
      const orgIds = membershipData.map(m => m.organization_id);
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      if (orgError) {
        console.error('❌ Error fetching organizations:', orgError);
        showErrorToast(orgError, 'Loading Organizations');
        throw orgError;
      }

      // Combine data
      const organizations: Organization[] = (orgData || []).map(org => {
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
          userRole: membership?.role as 'owner' | 'admin' | 'member' || 'member',
          userStatus: membership?.status as 'active' | 'pending' | 'inactive' || 'active'
        };
      });

      console.log('✅ Organizations fetched:', organizations);
      return organizations;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCurrentOrganization = (organizationId?: string) => {
  const { data: organizations } = useUserOrganizations();
  
  if (!organizationId || !organizations) return null;
  
  return organizations.find(org => org.id === organizationId) || null;
};
