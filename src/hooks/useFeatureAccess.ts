
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

interface FeatureAccessResult {
  has_access: boolean;
  subscription_details?: any;
  grace_period_info?: any;
  user_role?: string;
  reason?: string;
}

interface UseFeatureAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  subscriptionDetails: any;
  gracePeriodInfo: any;
  userRole: string | null;
  checkAccess: () => Promise<void>;
}

export function useFeatureAccess(featureKey: string): UseFeatureAccessResult {
  const { user } = useAuth();
  const { selectedOrganization } = useOrganization();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [gracePeriodInfo, setGracePeriodInfo] = useState(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const checkAccess = async () => {
    if (!user || !selectedOrganization || !featureKey) {
      setHasAccess(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Checking feature access:', { 
        featureKey, 
        orgId: selectedOrganization.id 
      });

      const { data, error } = await supabase.functions.invoke('check-feature-access', {
        body: {
          org_id: selectedOrganization.id,
          feature_key: featureKey
        }
      });

      if (error) {
        console.error('Feature access check error:', error);
        setError(error.message || 'Failed to check feature access');
        setHasAccess(false);
        return;
      }

      const result = data as FeatureAccessResult;
      console.log('Feature access result:', result);

      setHasAccess(result.has_access);
      setSubscriptionDetails(result.subscription_details);
      setGracePeriodInfo(result.grace_period_info);
      setUserRole(result.user_role || null);

      if (!result.has_access && result.reason) {
        console.log('Access denied reason:', result.reason);
      }

    } catch (err) {
      console.error('Error checking feature access:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, [user, selectedOrganization, featureKey]);

  return {
    hasAccess,
    isLoading,
    error,
    subscriptionDetails,
    gracePeriodInfo,
    userRole,
    checkAccess
  };
}
