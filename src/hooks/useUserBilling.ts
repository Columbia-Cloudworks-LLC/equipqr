
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

interface UserBillingInfo {
  total_users: number;
  billable_users: number;
  monthly_cost_cents: number;
  equipment_count: number;
  billing_required: boolean;
  exemption_applied?: boolean;
  exemption_details?: {
    type: 'organization' | 'individual';
    exemption_type?: 'full' | 'partial';
    free_user_count?: number;
    reason?: string;
    exempt_users?: number;
  };
}

interface GracePeriodInfo {
  has_grace_period: boolean;
  is_active: boolean;
  grace_period_start?: string;
  grace_period_end?: string;
  days_remaining?: number;
  equipment_count: number;
  billing_required: boolean;
}

interface UseUserBillingResult {
  billingInfo: UserBillingInfo | null;
  gracePeriodInfo: GracePeriodInfo | null;
  isLoading: boolean;
  error: string | null;
  userRole: string | null;
  refreshBilling: () => Promise<void>;
}

export function useUserBilling(): UseUserBillingResult {
  const { user } = useAuth();
  const { selectedOrganization } = useOrganization();
  const [billingInfo, setBillingInfo] = useState<UserBillingInfo | null>(null);
  const [gracePeriodInfo, setGracePeriodInfo] = useState<GracePeriodInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchBillingInfo = async () => {
    if (!user || !selectedOrganization) {
      setBillingInfo(null);
      setGracePeriodInfo(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching user billing info with exemptions for organization:', selectedOrganization.id);

      const { data, error } = await supabase.functions.invoke('get-user-billing-info', {
        body: {
          org_id: selectedOrganization.id
        }
      });

      if (error) {
        console.error('User billing info error:', error);
        setError(error.message || 'Failed to fetch billing information');
        return;
      }

      console.log('User billing result with exemptions:', data);
      setBillingInfo(data.billing_info);
      setGracePeriodInfo(data.grace_period_info);
      setUserRole(data.user_role || selectedOrganization.role || 'viewer');

    } catch (err) {
      console.error('Error fetching user billing info:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingInfo();
  }, [user, selectedOrganization]);

  return {
    billingInfo,
    gracePeriodInfo,
    isLoading,
    error,
    userRole,
    refreshBilling: fetchBillingInfo
  };
}
